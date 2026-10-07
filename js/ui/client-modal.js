/* Modal de cliente (criar, editar, excluir) */
import { COMBOS, DEFAULT_COMBO, DEFAULT_SLA_DAYS, OWNERS, STATUS_LABELS, STATUS_ORDER } from '../constants.js';
import { state } from '../store.js';
import { saveClient, deleteClient } from '../data/clients.js';
import { todayISO } from '../lib/dates.js';
import { escapeHtml, fmtBRL } from '../lib/format.js';
import { attachCurrencyMask, attachPhoneMask, formatCurrencyValue, formatPhone, parseCurrency } from '../lib/mask.js';
import { newId } from '../lib/mappers.js';
import { applyStatusDates } from '../lib/rules.js';
import { validateClient } from '../lib/validate.js';
import { $, $$, toast } from './dom.js';
import { createModal } from './modal.js';

const FIELD_IDS = { name:'fName', whatsapp:'fWhats', price:'fPrice', saleDate:'fDate', status:'fStatus', slaDays:'fSla' };

let editingId = null;
let selectedItems = [DEFAULT_COMBO];
let onSaved = null;

const modal = createModal($('#clientOverlay'), {
  onClose(){ editingId = null; onSaved = null; },
  closeOnOutsideClick: false,
});

// Opções montadas a partir das constantes, para o HTML não repetir nomes e preços.
const optionButtons = c => Object.entries(COMBOS).filter(([, v]) => v.kind === c).map(([key, v]) =>
  `<button type="button" class="combo-opt" data-key="${key}" aria-pressed="false">
    <span class="cn">${escapeHtml(v.label)}</span><span class="cp mono">${fmtBRL(v.price)}</span>
  </button>`).join('');
$('#comboPick').innerHTML = optionButtons('combo');
$('#addonPick').innerHTML = optionButtons('addon');
const sumPrice = items => items.reduce((s, k) => s + (COMBOS[k]?.price || 0), 0);
$('#fOwner').innerHTML = OWNERS.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
$('#fStatus').innerHTML = STATUS_ORDER.map(s => `<option value="${s}">${escapeHtml(STATUS_LABELS[s])}</option>`).join('');
attachPhoneMask($('#fWhats'));
attachCurrencyMask($('#fPrice'));

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
  $('#fWhats').value = formatPhone((data.whatsapp || '').replace(/\D/g, ''));
  $('#fNiche').value = data.niche || '';
  $('#fDate').value = data.saleDate || todayISO();
  $('#fSla').value = data.slaDays || DEFAULT_SLA_DAYS;
  $('#fOwner').value = data.owner || OWNERS[0];
  $('#fStatus').value = data.status || 'pendente';
  $('#fNotes').value = data.notes || '';
  $('#btnDelete').hidden = !client;

  const combo = Array.isArray(data.combo) && data.combo.length && data.combo.every(k => COMBOS[k]) ? data.combo : [DEFAULT_COMBO];
  pickItems(combo);
  $('#fPrice').value = client ? (client.price != null ? formatCurrencyValue(client.price) : '') : formatCurrencyValue(sumPrice(combo));
}

function pickItems(items){
  selectedItems = items;
  $$('.combo-opt').forEach(o => {
    const picked = selectedItems.includes(o.dataset.key);
    o.classList.toggle('picked', picked);
    o.setAttribute('aria-pressed', picked);
  });
}

// Combo fechado é escolha única; itens avulsos (abaixo) se somam entre si, mas não com um combo.
function onPickOption(e){
  const opt = e.target.closest('.combo-opt');
  if(!opt) return;
  const key = opt.dataset.key;
  if(COMBOS[key].kind === 'combo'){
    pickItems([key]);
  } else {
    const onlyAddons = selectedItems.every(k => COMBOS[k].kind === 'addon');
    const items = onlyAddons ? [...selectedItems] : [];
    const idx = items.indexOf(key);
    idx >= 0 ? items.splice(idx, 1) : items.push(key);
    pickItems(items);
  }
  $('#fPrice').value = formatCurrencyValue(sumPrice(selectedItems));
}
$('#comboPick').addEventListener('click', onPickOption);
$('#addonPick').addEventListener('click', onPickOption);

function readForm(){
  const existing = editingId ? state.clients.find(c => c.id === editingId) : null;
  const priceText = $('#fPrice').value.trim();
  return {
    id: editingId || newId('c'),
    name: $('#fName').value.trim(),
    whatsapp: $('#fWhats').value.trim(),
    niche: $('#fNiche').value.trim(),
    combo: selectedItems,
    // campo vazio = soma do preço de tabela; 0 digitado é 0 mesmo (cortesia)
    price: priceText === '' ? sumPrice(selectedItems) : parseCurrency(priceText),
    saleDate: $('#fDate').value,
    slaDays: parseInt($('#fSla').value, 10),
    owner: $('#fOwner').value,
    status: $('#fStatus').value,
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
