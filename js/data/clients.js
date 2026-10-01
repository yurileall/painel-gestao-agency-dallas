/* Clientes: mapeamento, leitura/gravação e regras de prazo */
/* ---------- MAPEAMENTO client (JS) <-> clients (linha do banco) ---------- */
function clientToRow(c){
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp || null,
    niche: c.niche || null,
    combo: c.combo || null,
    price: c.price || 0,
    sale_date: c.saleDate || null,
    owner: c.owner || null,
    status: c.status,
    deliverables: c.deliverables || {},
    notes: c.notes || null,
    delivered_date: c.deliveredDate || null,
    producao_start_date: c.producaoStartDate || null,
  };
}
function rowToClient(r){
  return {
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    niche: r.niche,
    combo: r.combo,
    price: r.price != null ? Number(r.price) : 0,
    saleDate: r.sale_date,
    owner: r.owner,
    status: r.status,
    deliverables: r.deliverables || {},
    notes: r.notes,
    deliveredDate: r.delivered_date,
    producaoStartDate: r.producao_start_date,
  };
}

async function loadClients(){
  try{
    const { data, error } = await supabaseClient.from('clients').select('*');
    if(error) throw error;
    clients = (data || []).map(rowToClient);
  }catch(e){
    console.error('Falha ao carregar clientes', e);
    clients = [];
    toast('Não foi possível carregar os clientes: ' + dbErrorMessage(e), 'error');
  }
}
/* Devolve true somente quando o banco confirmou a gravação. Quem chama
   PRECISA checar o retorno: antes isso falhava calado e a tela continuava
   mostrando o cliente que nunca chegou ao banco. */
async function saveClients(){
  try{
    const rows = clients.map(clientToRow);
    if(rows.length){
      const { error } = await supabaseClient.from('clients').upsert(rows, { onConflict: 'id' });
      if(error) throw error;
    }
    // remove no banco qualquer cliente que não exista mais localmente (exclusões)
    const { data: existing, error: selErr } = await supabaseClient.from('clients').select('id');
    if(selErr) throw selErr;
    const localIds = new Set(clients.map(c=>c.id));
    const toDelete = (existing || []).map(r=>r.id).filter(id=>!localIds.has(id));
    if(toDelete.length){
      const { error: delErr } = await supabaseClient.from('clients').delete().in('id', toDelete);
      if(delErr) throw delErr;
    }
    return true;
  }catch(e){
    console.error('Falha ao salvar clientes', e);
    toast('Não foi possível salvar no banco: ' + dbErrorMessage(e), 'error');
    return false;
  }
}

function agingInfo(client){
  const days = daysBetween(client.saleDate, client.status==='entregue' ? client.deliveredDate : null);
  let level = 'ok';
  if(client.status!=='entregue'){
    if(days > slaDays) level = 'atrasado';
    else if(days === slaDays) level = 'atencao';
  } else {
    level = (days > slaDays) ? 'atrasado' : 'ok';
  }
  return { days, level };
}
async function moveClientToStatus(id, newStatus){
  const c = clients.find(c=>c.id===id);
  if(!c || c.status===newStatus) return;
  /* Guarda o estado anterior: se o banco recusar, a tela volta ao que era
     em vez de mostrar um card movido que não foi salvo. */
  const antes = { status:c.status, deliveredDate:c.deliveredDate, producaoStartDate:c.producaoStartDate };
  c.status = newStatus;
  const today = new Date().toISOString().slice(0,10);
  if((newStatus==='em_producao' || newStatus==='entregue') && !c.producaoStartDate) c.producaoStartDate = today;
  if(newStatus==='entregue' && !c.deliveredDate) c.deliveredDate = today;
  if(newStatus!=='entregue') c.deliveredDate = null;
  const ok = await saveClients();
  if(!ok) Object.assign(c, antes);
  renderPipeline();
}
