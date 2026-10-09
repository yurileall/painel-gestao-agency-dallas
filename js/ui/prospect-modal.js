/* Modal de prospecção (criar, editar, excluir um perfil abordado) */
import { PROSPECT_CHANNELS, PROSPECT_STATUS_LABELS, PROSPECT_STATUS_ORDER, SCENARIOS } from '../constants.js';
import { state } from '../store.js';
import { saveProspect, deleteProspect } from '../data/prospects.js';
import { todayISO } from '../lib/dates.js';
import { escapeHtml } from '../lib/format.js';
import { attachPhoneMask, formatPhone } from '../lib/mask.js';
import { newId } from '../lib/mappers.js';
import { normalizeHandle, validateProspect } from '../lib/validate.js';
import { $, toast } from './dom.js';
import { createModal } from './modal.js';

const FIELD_IDS = {
  handle:'pHandle', whatsapp:'pWhats', scenario:'pScenario', channel:'pChannel', firstMsgDate:'pFirstMsgDate',
  status:'pStatus', nextStepDate:'pNextStepDate',
};

let editingId = null;

const modal = createModal($('#prospectOverlay'), {
  onClose(){ editingId = null; },
});

const options = entries => entries.map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`).join('');
$('#pScenario').innerHTML = '<option value="">Ainda não avaliei</option>'
  + options(Object.entries(SCENARIOS).map(([key, s]) => [key, `${key} — ${s.sees}`]));
$('#pChannel').innerHTML = options(Object.entries(PROSPECT_CHANNELS));
$('#pStatus').innerHTML = options(PROSPECT_STATUS_ORDER.map(s => [s, PROSPECT_STATUS_LABELS[s]]));
attachPhoneMask($('#pWhats'));

/* O gancho do cenário escolhido fica à vista: é o argumento da mensagem. */
function showHook(){
  const hook = SCENARIOS[$('#pScenario').value]?.hook;
  $('#pScenarioHook').textContent = hook ? `Gancho: ${hook}` : '';
  $('#pScenarioHook').hidden = !hook;
}
$('#pScenario').addEventListener('change', showHook);

/* "A abordar" ainda não tem mensagem: a data fica travada e vazia até o status mudar. */
function syncFirstMsgDate(){
  const date = $('#pFirstMsgDate');
  const notSent = $('#pStatus').value === 'a_abordar';
  date.disabled = notSent;
  if(notSent) date.value = '';
  else if(!date.value) date.value = todayISO();
}
$('#pStatus').addEventListener('change', syncFirstMsgDate);

/** @param {import('../lib/mappers.js').Prospect|null} prospect null para um perfil novo */
export function openProspectModal(prospect){
  modal.open();
  editingId = prospect ? prospect.id : null;
  $('#prospectModalTitle').textContent = prospect ? 'Editar perfil' : 'Novo perfil';
  $('#pHandle').value = prospect ? '@' + prospect.handle : '';
  $('#pWhats').value = formatPhone((prospect?.whatsapp || '').replace(/\D/g, ''));
  $('#pNiche').value = prospect?.niche || '';
  $('#pScenario').value = prospect?.scenario || '';
  $('#pChannel').value = prospect?.channel || Object.keys(PROSPECT_CHANNELS)[0];
  $('#pStatus').value = prospect?.status || 'enviada';
  $('#pFirstMsgDate').value = prospect?.firstMsgDate || '';
  $('#pNextStep').value = prospect?.nextStep || '';
  $('#pNextStepDate').value = prospect?.nextStepDate || '';
  $('#btnDeleteProspect').hidden = !prospect;
  showHook();
  syncFirstMsgDate();
}

$('#btnSaveProspect').addEventListener('click', async () => {
  const prospect = {
    id: editingId || newId('p'),
    handle: normalizeHandle($('#pHandle').value),
    whatsapp: $('#pWhats').value.trim(),
    niche: $('#pNiche').value.trim(),
    scenario: $('#pScenario').value,
    channel: $('#pChannel').value,
    firstMsgDate: $('#pFirstMsgDate').value || null,
    status: $('#pStatus').value,
    nextStep: $('#pNextStep').value.trim(),
    nextStepDate: $('#pNextStepDate').value || null,
  };
  const errors = validateProspect(prospect, state.prospects);
  if(Object.keys(errors).length){ modal.showErrors(errors, FIELD_IDS); return; }

  const res = await modal.busy($('#btnSaveProspect'), 'Salvando...', () => saveProspect(prospect));
  if(!res.ok){
    modal.setFormError(`Não foi salvo: ${res.message} Seus dados continuam aqui — clique em Salvar para tentar de novo.`);
    return;
  }
  modal.close();
  toast('Perfil salvo.', 'ok');
});

$('#btnDeleteProspect').addEventListener('click', async () => {
  const prospect = state.prospects.find(p => p.id === editingId);
  if(!prospect) return;
  if(!confirm(`Excluir o perfil "@${prospect.handle}"? Essa ação não pode ser desfeita.`)) return;

  const res = await modal.busy($('#btnDeleteProspect'), 'Excluindo...', () => deleteProspect(prospect.id));
  if(!res.ok){ modal.setFormError(`Não foi excluído: ${res.message}`); return; }
  modal.close();
  toast('Perfil excluído.', 'ok');
});

$('#btnCancelProspect').addEventListener('click', modal.close);
