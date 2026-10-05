/* Modal de lead (criar, editar, excluir, converter) */
const leadOverlay = $('#leadOverlay');
function openLeadModal(lead){
  editingLeadId = lead ? lead.id : null;
  $('#leadModalTitle').textContent = lead ? 'Editar lead' : 'Novo lead';
  $('#lName').value = lead?.name || '';
  $('#lWhats').value = lead?.whatsapp || '';
  $('#lCombo').value = lead?.combo || '';
  $('#lContactDate').value = lead?.contactDate || new Date().toISOString().slice(0,10);
  $('#lFollowUpDate').value = lead?.followUpDate || '';
  $('#lNotes').value = lead?.notes || '';
  $('#btnDeleteLead').style.display = lead ? 'inline-flex' : 'none';
  $('#btnConvertLead').style.display = lead ? 'inline-flex' : 'none';
  leadOverlay.classList.add('open');
}
function closeLeadModal(){ leadOverlay.classList.remove('open'); editingLeadId=null; }
$('#closeLeadModal').onclick = closeLeadModal;
$('#btnCancelLead').onclick = closeLeadModal;
leadOverlay.addEventListener('click', e=>{ if(e.target===leadOverlay) closeLeadModal(); });
$('#btnNewLead').onclick = ()=>openLeadModal(null);

$('#btnSaveLead').onclick = async ()=>{
  const name = $('#lName').value.trim();
  if(!name){ $('#lName').focus(); return; }
  const lead = {
    id: editingLeadId || uid(),
    name,
    whatsapp: $('#lWhats').value.trim(),
    combo: $('#lCombo').value,
    contactDate: $('#lContactDate').value,
    followUpDate: $('#lFollowUpDate').value || null,
    notes: $('#lNotes').value.trim(),
  };
  const idx = editingLeadId ? leads.findIndex(l=>l.id===editingLeadId) : -1;
  const anterior = idx >= 0 ? leads[idx] : null;
  if(idx >= 0){ leads[idx] = lead; } else { leads.push(lead); }

  const btn = $('#btnSaveLead');
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Salvando...';
  const ok = await saveLead(lead);
  btn.disabled = false; btn.textContent = label;

  if(!ok){
    if(idx >= 0){ leads[idx] = anterior; } else { leads = leads.filter(l=>l!==lead); }
    return;
  }
  closeLeadModal();
  renderLeadsTable();
};

$('#btnDeleteLead').onclick = async ()=>{
  if(!editingLeadId) return;
  const id = editingLeadId;
  const alvo = leads.find(l=>l.id===id);
  if(!confirm(`Excluir o lead "${alvo?.name || ''}"? Isso não pode ser desfeito.`)) return;
  const ok = await deleteLead(id);
  if(!ok) return;
  leads = leads.filter(l=>l.id!==id);
  closeLeadModal();
  renderLeadsTable();
};

$('#btnConvertLead').onclick = ()=>{
  if(!editingLeadId) return;
  const lead = leads.find(l=>l.id===editingLeadId);
  if(!lead) return;
  closeLeadModal();
  // abre o modal de cliente pré-preenchido com os dados do lead
  openModal(null);
  $('#fName').value = lead.name;
  $('#fWhats').value = lead.whatsapp;
  $('#fNiche').value = '';
  if(lead.combo){ pickCombo(lead.combo, true); renderChecklist({}, lead.combo); }
  $('#fNotes').value = lead.notes ? `(Veio do follow-up) ${lead.notes}` : '';
  // openModal() zerou o pendente; marca agora para o save consumir
  pendingLeadId = lead.id;
};
