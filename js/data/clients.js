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
/* Grava UM cliente. Nada de mandar a lista inteira: o painel tem login e
   pode estar aberto em mais de uma aba ou por mais de uma pessoa, e subir o
   array local inteiro (com a limpeza dos ids que "sobram") apagava o que o
   outro tinha acabado de cadastrar.
   Devolve true só quando o banco confirmou. Quem chama PRECISA checar. */
async function saveClient(client){
  try{
    const row = clientToRow(client);
    row.updated_at = new Date().toISOString();
    const { error } = await supabaseClient.from('clients').upsert(row, { onConflict: 'id' });
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao salvar cliente', e);
    toast('Não foi possível salvar no banco: ' + dbErrorMessage(e), 'error');
    return false;
  }
}

/* Apaga UM cliente, pelo id. */
async function deleteClient(id){
  try{
    const { error } = await supabaseClient.from('clients').delete().eq('id', id);
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao excluir cliente', e);
    toast('Não foi possível excluir no banco: ' + dbErrorMessage(e), 'error');
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
  const ok = await saveClient(c);
  if(!ok) Object.assign(c, antes);
  renderPipeline();
}
