/* Tela: Clientes */
import { COMBOS, STATUS_LABELS, STATUS_ORDER } from '../constants.js';
import { state } from '../store.js';
import { escapeHtml, fmtBRL, fmtDate } from '../lib/format.js';
import { $, avatar, comboLabel, emptyState, nameCell, statusBadge } from '../ui/dom.js';
import { openClientModal } from '../ui/client-modal.js';

const wrap = $('#clientsTableWrap');
const searchInput = $('#searchInput');
const statusFilter = $('#statusFilter');
const comboFilter = $('#comboFilter');

statusFilter.innerHTML = '<option value="">Todos os status</option>'
  + STATUS_ORDER.map(s => `<option value="${s}">${escapeHtml(STATUS_LABELS[s])}</option>`).join('');
comboFilter.innerHTML = '<option value="">Todos os combos</option>'
  + Object.entries(COMBOS).map(([key, c]) => `<option value="${key}">${escapeHtml(c.label)}</option>`).join('');

export function renderClientsTable(){
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const combo = comboFilter.value;
  const matches = text => (text || '').toLowerCase().includes(search);

  const list = state.clients
    .filter(c => (!search || matches(c.name) || matches(c.niche)) && (!status || c.status === status) && (!combo || (c.combo || []).includes(combo)))
    .sort((a, b) => (b.saleDate || '').localeCompare(a.saleDate || ''));

  wrap.innerHTML = list.length ? `
    <table>
      <thead><tr><th>Cliente</th><th>Combo</th><th>Responsável</th><th>Valor</th><th>Status</th><th>Data da venda</th></tr></thead>
      <tbody>
        ${list.map(c => `
          <tr class="client-row" data-id="${escapeHtml(c.id)}">
            <td>${nameCell(c.id, c.name, `${c.niche || '—'} · ${c.whatsapp || 'sem whatsapp'}`)}</td>
            <td data-label="Combo"><span class="combo-tag">${comboLabel(c.combo)}</span></td>
            <td data-label="Responsável">${c.owner ? `<span class="owner-chip">${avatar(c.owner, 'sm')}${escapeHtml(c.owner)}</span>` : '—'}</td>
            <td data-label="Valor" class="mono">${fmtBRL(c.price)}</td>
            <td data-label="Status">${statusBadge(c.status)}</td>
            <td data-label="Data da venda" class="mono dim">${fmtDate(c.saleDate)}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : emptyState(state.clients.length
      ? 'Nenhum cliente encontrado com esses filtros.'
      : 'Nenhum cliente cadastrado ainda. Comece adicionando o primeiro projeto vendido.');
}

// espera o usuário parar de digitar antes de refazer a tabela
let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderClientsTable, 150);
});
statusFilter.addEventListener('change', renderClientsTable);
comboFilter.addEventListener('change', renderClientsTable);

wrap.addEventListener('click', e => {
  const row = e.target.closest('.client-row');
  if(row) openClientModal(state.clients.find(c => c.id === row.dataset.id));
});
