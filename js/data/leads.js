/* Leads (follow-up): estado, mapeamento e leitura/gravação */
// ---------- LEADS (FOLLOW-UP) ----------
let leads = [];
let editingLeadId = null;

function leadToRow(l){
  return {
    id: l.id,
    name: l.name,
    whatsapp: l.whatsapp || null,
    combo: l.combo || null,
    contact_date: l.contactDate || null,
    follow_up_date: l.followUpDate || null,
    notes: l.notes || null,
  };
}
function rowToLead(r){
  return {
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    combo: r.combo,
    contactDate: r.contact_date,
    followUpDate: r.follow_up_date,
    notes: r.notes,
  };
}

async function loadLeads(){
  try{
    const { data, error } = await supabaseClient.from('leads').select('*');
    if(error) throw error;
    leads = (data || []).map(rowToLead);
  }catch(e){
    console.error('Falha ao carregar leads', e);
    leads = [];
    toast('Não foi possível carregar os leads: ' + dbErrorMessage(e), 'error');
  }
}
/* Um lead por vez, mesmo motivo de saveClient(). */
async function saveLead(lead){
  try{
    const row = leadToRow(lead);
    row.updated_at = new Date().toISOString();
    const { error } = await supabaseClient.from('leads').upsert(row, { onConflict: 'id' });
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao salvar lead', e);
    toast('Não foi possível salvar no banco: ' + dbErrorMessage(e), 'error');
    return false;
  }
}

async function deleteLead(id){
  try{
    const { error } = await supabaseClient.from('leads').delete().eq('id', id);
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao excluir lead', e);
    toast('Não foi possível excluir no banco: ' + dbErrorMessage(e), 'error');
    return false;
  }
}

function leadAging(lead){
  const daysSince = daysBetween(lead.contactDate, null);
  if(lead.followUpDate){
    const daysToFollowUp = daysBetween(new Date().toISOString().slice(0,10), lead.followUpDate);
    if(daysToFollowUp <= 0) return { level:'atrasado', label: daysToFollowUp===0 ? 'chamar hoje' : `atrasado ${Math.abs(daysToFollowUp)}d` };
    if(daysToFollowUp === 1) return { level:'atencao', label:'chamar amanhã' };
    return { level:'ok', label:`chamar em ${daysToFollowUp}d` };
  }
  return { level:'ok', label:`${daysSince}d sem contato` };
}
