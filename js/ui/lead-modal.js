/* Modal de lead (criar, editar, excluir, converter em cliente) */
import { COMBOS } from '../constants.js';
import { state } from '../store.js';
import { saveLead, deleteLead } from '../data/leads.js';
import { todayISO } from '../lib/dates.js';
import { escapeHtml } from '../lib/format.js';
import { newId } from '../lib/mappers.js';
import { validateLead } from '../lib/validate.js';
import { $, toast } from './dom.js';
import { createModal } from './modal.js';
import { openClientModal } from './client-modal.js';

const FIELD_IDS = { name:'lName', whatsapp:'lWhats', combo:'lCombo', contactDate:'lContactDate', followUpDate:'lFollowUpDate' };

let editingId = null;

const modal = createModal($('#leadOverlay'), {
  onClose(){ editingId = null; },
});

$('#lCombo').innerHTML = '<option value="">Ainda não decidiu</option>'
  + Object.entries(COMBOS).map(([key, c]) => `<option value="${key}">${escapeHtml(c.label)}</option>`).join('');

/** @param {import('../lib/mappers.js').Lead|null} lead null para um lead novo */
export function openLeadModal(lead){
  modal.open();
  editingId = lead ? lead.id : null;
  $('#leadModalTitle').textContent = lead ? 'Editar lead' : 'Novo lead';
  $('#lName').value = lead?.name || '';
  $('#lWhats').value = lead?.whatsapp || '';
  $('#lCombo').value = lead?.combo || '';
  $('#lContactDate').value = lead?.contactDate || todayISO();
  $('#lFollowUpDate').value = lead?.followUpDate || '';
  $('#lNotes').value = lead?.notes || '';
  $('#btnDeleteLead').hidden = !lead;
  $('#btnConvertLead').hidden = !lead;
}

$('#btnSaveLead').addEventListener('click', async () => {
  const lead = {
    id: editingId || newId('l'),
    name: $('#lName').value.trim(),
    whatsapp: $('#lWhats').value.trim(),
    combo: $('#lCombo').value,
    contactDate: $('#lContactDate').value,
    followUpDate: $('#lFollowUpDate').value || null,
    notes: $('#lNotes').value.trim(),
  };
  const errors = validateLead(lead);
  if(Object.keys(errors).length){ modal.showErrors(errors, FIELD_IDS); return; }

  const res = await modal.busy($('#btnSaveLead'), 'Salvando...', () => saveLead(lead));
  if(!res.ok){
    modal.setFormError(`Não foi salvo: ${res.message} Seus dados continuam aqui — clique em Salvar para tentar de novo.`);
    return;
  }
  modal.close();
  toast('Lead salvo.', 'ok');
});

$('#btnDeleteLead').addEventListener('click', async () => {
  const lead = state.leads.find(l => l.id === editingId);
  if(!lead) return;
  if(!confirm(`Excluir o lead "${lead.name}"? Essa ação não pode ser desfeita.`)) return;

  const res = await modal.busy($('#btnDeleteLead'), 'Excluindo...', () => deleteLead(lead.id));
  if(!res.ok){ modal.setFormError(`Não foi excluído: ${res.message}`); return; }
  modal.close();
  toast('Lead excluído.', 'ok');
});

/* Abre o modal de cliente já preenchido. O lead só sai do follow-up depois que
   o cliente entra no banco; se o usuário cancelar, nada acontece com o lead. */
$('#btnConvertLead').addEventListener('click', () => {
  const lead = state.leads.find(l => l.id === editingId);
  if(!lead) return;
  modal.close();
  openClientModal(null, {
    prefill: {
      name: lead.name,
      whatsapp: lead.whatsapp,
      combo: lead.combo,
      notes: lead.notes ? `(Veio do follow-up) ${lead.notes}` : '',
    },
    async onSaved(){
      const res = await deleteLead(lead.id);
      if(!res.ok) toast(`Cliente criado, mas o lead "${lead.name}" continua no follow-up: ${res.message}`, 'error');
    },
  });
});

$('#btnCancelLead').addEventListener('click', modal.close);
