/* Tela: Dashboard */
import { COMBOS } from '../constants.js';
import { state } from '../store.js';
import { monthLabel } from '../lib/dates.js';
import { escapeHtml, fmtBRL, fmtDate } from '../lib/format.js';
import { availableMonths, dashboardStats } from '../lib/stats.js';
import { $, barRow, comboLabel, emptyState, statusBadge } from '../ui/dom.js';
import { openClientModal } from '../ui/client-modal.js';

const monthFilter = $('#monthFilter');
const recentWrap = $('#recentTableWrap');

function renderMonthFilter(){
  const months = availableMonths(state.clients);
  const current = monthFilter.value;
  monthFilter.innerHTML = '<option value="">Todo o período</option>'
    + months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join('');
  if(months.includes(current)) monthFilter.value = current;
}

export function renderDashboard(){
  renderMonthFilter();
  const month = monthFilter.value;
  const s = dashboardStats(state.clients, month);

  $('#kpiDelivered').textContent = s.delivered;
  $('#kpiRevenue').textContent = fmtBRL(s.revenue);
  $('#kpiDeals').textContent = s.deals;
  $('#kpiAvg').textContent = fmtBRL(s.avgTicket);
  $('#kpiDeliveredSub').textContent = month ? `em ${monthLabel(month)}` : 'em todo o período';

  recentWrap.innerHTML = s.recent.length ? `
    <table>
      <thead><tr><th>Cliente</th><th>Combo</th><th>Status</th><th>Data</th></tr></thead>
      <tbody>
        ${s.recent.map(c => `
          <tr class="client-row" data-id="${escapeHtml(c.id)}">
            <td><button type="button" class="row-link" data-fk="open:${escapeHtml(c.id)}">${escapeHtml(c.name)}</button><div class="cell-sub">${escapeHtml(c.niche || '—')}</div></td>
            <td data-label="Combo"><span class="combo-tag">${comboLabel(c.combo)}</span></td>
            <td data-label="Status">${statusBadge(c.status)}</td>
            <td data-label="Data" class="mono dim">${fmtDate(c.saleDate)}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : emptyState('Nenhum cliente cadastrado ainda no período.');

  const total = s.deals || 1;
  $('#comboBars').innerHTML = Object.keys(COMBOS).map(k =>
    barRow(COMBOS[k].label, Math.round(s.comboCounts[k] / total * 100), s.comboCounts[k])).join('');
}

monthFilter.addEventListener('change', renderDashboard);

recentWrap.addEventListener('click', e => {
  const row = e.target.closest('.client-row');
  if(row) openClientModal(state.clients.find(c => c.id === row.dataset.id));
});
