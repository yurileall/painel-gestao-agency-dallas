/* Modal de cliente (criar, editar, excluir) */
import { COMBOS, DEFAULT_COMBO, DELIVERABLE_LABELS, LINK_DELIVERABLES, OWNERS, STATUS_LABELS, STATUS_ORDER } from '../constants.js';
import { state } from '../store.js';
import { saveClient, deleteClient } from '../data/clients.js';
import { todayISO } from '../lib/dates.js';
import { escapeHtml, fmtBRL } from '../lib/format.js';
import { newId } from '../lib/mappers.js';
import { applyStatusDates } from '../lib/rules.js';
import { normalizeDeliverables, validateClient } from '../lib/validate.js';
import { $, $$, toast } from './dom.js';
import { createModal } from './modal.js';

const FIELD_IDS = { name:'fName', whatsapp:'fWhats', price:'fPrice', saleDate:'fDate', status:'fStatus' };

let editingId = null;
let selectedCombo = DEFAULT_COMBO;
let onSaved = null;

const modal = createModal($('#clientOverlay'), {
  onClose(){ editingId = null; onSaved = null; },
});

// Opções montadas a partir das constantes, para o HTML não repetir nomes e preços.
$('#comboPick').innerHTML = Object.entries(COMBOS).map(([key, c]) =>
  `<button type="button" class="combo-opt" data-combo="${key}" aria-pressed="false">
    <span class="cn">${escapeHtml(c.label)}</span><span class="cp mono">${fmtBRL(c.price)}</span>
  </button>`).join('');
$('#fOwner').innerHTML = OWNERS.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
$('#fStatus').innerHTML = STATUS_ORDER.map(s => `<option value="${s}">${escapeHtml(STATUS_LABELS[s])}</option>`).join('');

/**
 * @param {import('../lib/mappers.js').Client|null} client null para um cliente novo
 * @param {Object} [opts]
 * @param {Partial<import('../lib/mappers.js').Client>} [opts.prefill] valores iniciais de um cliente novo (conversão de lead)
 * @param {(client: import('../lib/mappers.js').Client) => void} [opts.onSaved] roda só depois de o banco confirmar
 */
export function openClientModal(client, opts = {}){
  const data = client || opts.prefill || {};
  modal.open();
  editingId = client ? client.id : null;
  onSaved = opts.onSaved || null;

  $('#modalTitle').textContent = client ? 'Editar cliente' : 'Novo cliente';
  $('#fName').value = data.name || '';
  $('#fWhats').value = data.whatsapp || '';
  $('#fNiche').value = data.niche || '';
  $('#fDate').value = data.saleDate || todayISO();
  $('#fOwner').value = data.owner || OWNERS[0];
  $('#fStatus').value = data.status || 'pendente';
  $('#fNotes').value = data.notes || '';
  $('#btnDelete').hidden = !client;

  const combo = COMBOS[data.combo] ? data.combo : DEFAULT_COMBO;
  pickCombo(combo);
  $('#fPrice').value = client ? (client.price ?? '') : COMBOS[combo].price.toFixed(2);
  renderChecklist(data.deliverables || {}, combo);
}

function pickCombo(combo){
  selectedCombo = combo;
  $$('.combo-opt').forEach(o => {
    const picked = o.dataset.combo === combo;
    o.classList.toggle('picked', picked);
    o.setAttribute('aria-pressed', picked);
  });
}

$('#comboPick').addEventListener('click', e => {
  const opt = e.target.closest('.combo-opt');
  if(!opt) return;
  const marked = collectChecklist(); // preserva o que já foi marcado ao trocar de combo
  pickCombo(opt.dataset.combo);
  $('#fPrice').value = COMBOS[selectedCombo].price.toFixed(2);
  renderChecklist(marked, selectedCombo);
});

function renderChecklist(existing, combo){
  $('#deliverablesChecklist').innerHTML = COMBOS[combo].deliverables.map(key => {
    const done = existing[key]?.done ?? existing[key] ?? false;
    const label = DELIVERABLE_LABELS[key];
    const link = LINK_DELIVERABLES.includes(key)
      ? `<input type="text" inputmode="url" data-extra="${key}" placeholder="link" aria-label="Link — ${escapeHtml(label)}" value="${escapeHtml(existing[key]?.url || '')}">`
      : '';
    return `<div class="check-item">
      <input type="checkbox" id="chk_${key}" data-key="${key}" ${done ? 'checked' : ''}>
      <label for="chk_${key}">${escapeHtml(label)}</label>
      ${link}
    </div>`;
  }).join('');
}

function collectChecklist(){
  const data = {};
  $$('#deliverablesChecklist .check-item').forEach(item => {
    const cb = $('input[type=checkbox]', item);
    const link = $('input[data-extra]', item);
    data[cb.dataset.key] = link ? { done: cb.checked, url: link.value } : cb.checked;
  });
  return data;
}

function readForm(){
  const existing = editingId ? state.clients.find(c => c.id === editingId) : null;
  const priceText = $('#fPrice').value.trim();
  return {
    id: editingId || newId('c'),
    name: $('#fName').value.trim(),
    whatsapp: $('#fWhats').value.trim(),
    niche: $('#fNiche').value.trim(),
    combo: selectedCombo,
    // campo vazio = preço de tabela do combo; 0 digitado é 0 mesmo (cortesia)
    price: priceText === '' ? COMBOS[selectedCombo].price : Number(priceText),
    saleDate: $('#fDate').value,
    owner: $('#fOwner').value,
    status: $('#fStatus').value,
    deliverables: normalizeDeliverables(collectChecklist()),
    notes: $('#fNotes').value.trim(),
    deliveredDate: existing?.deliveredDate || null,
    producaoStartDate: existing?.producaoStartDate || null,
  };
}

$('#btnSave').addEventListener('click', async () => {
  const draft = readForm();
  const errors = validateClient(draft);
  if(Object.keys(errors).length){ modal.showErrors(errors, FIELD_IDS); return; }

  const client = applyStatusDates(draft);
  const afterSave = onSaved; // guardado antes: fechar o modal durante a gravação zera onSaved
  const res = await modal.busy($('#btnSave'), 'Salvando...', () => saveClient(client));
  if(!res.ok){
    // o modal fica aberto com tudo que foi digitado; salvar de novo é seguro
    modal.setFormError(`Não foi salvo: ${res.message} Seus dados continuam aqui — clique em Salvar para tentar de novo.`);
    return;
  }
  modal.close();
  toast('Cliente salvo.', 'ok');
  afterSave?.(client);
});

$('#btnDelete').addEventListener('click', async () => {
  const client = state.clients.find(c => c.id === editingId);
  if(!client) return;
  if(!confirm(`Excluir o cliente "${client.name}"? Essa ação não pode ser desfeita.`)) return;

  const res = await modal.busy($('#btnDelete'), 'Excluindo...', () => deleteClient(client.id));
  if(!res.ok){ modal.setFormError(`Não foi excluído: ${res.message}`); return; }
  modal.close();
  toast('Cliente excluído.', 'ok');
});

$('#btnCancel').addEventListener('click', modal.close);
