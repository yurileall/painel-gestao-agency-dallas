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
async function saveLeads(){
  try{
    const rows = leads.map(leadToRow);
    if(rows.length){
      const { error } = await supabaseClient.from('leads').upsert(rows, { onConflict: 'id' });
      if(error) throw error;
    }
    const { data: existing, error: selErr } = await supabaseClient.from('leads').select('id');
    if(selErr) throw selErr;
    const localIds = new Set(leads.map(l=>l.id));
    const toDelete = (existing || []).map(r=>r.id).filter(id=>!localIds.has(id));
    if(toDelete.length){
      const { error: delErr } = await supabaseClient.from('leads').delete().in('id', toDelete);
      if(delErr) throw delErr;
    }
    return true;
  }catch(e){
    console.error('Falha ao salvar leads', e);
    toast('Não foi possível salvar no banco: ' + dbErrorMessage(e), 'error');
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
