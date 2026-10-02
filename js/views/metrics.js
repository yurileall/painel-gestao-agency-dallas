/* Tela: Métricas */
import { state } from '../store.js';
import { monthLabel } from '../lib/dates.js';
import { operationMetrics } from '../lib/stats.js';
import { $, barRow, emptyState } from '../ui/dom.js';

const days = v => `${v === null ? '—' : v.toFixed(1)} <span>dias</span>`;

export function renderMetrics(){
  const m = operationMetrics(state.clients);

  $('#metTotal').textContent = m.total;
  $('#metWait').innerHTML = days(m.avgWaitDays);
  $('#metProd').innerHTML = days(m.avgProductionDays);
  $('#metFinish').textContent = (m.finishRate === null ? '—' : m.finishRate) + '%';

  const maxMonth = Math.max(...m.byMonth.map(x => x.count), 1);
  $('#metMonthly').innerHTML = m.byMonth.length
    ? m.byMonth.map(x => barRow(monthLabel(x.month), Math.round(x.count / maxMonth * 100), x.count)).join('')
    : emptyState('Sem vendas registradas ainda.');

  const maxLoad = Math.max(...m.ownerLoad.map(x => x.count), 1);
  $('#metOwnerLoad').innerHTML = m.ownerLoad.length
    ? m.ownerLoad.map(x => barRow(x.owner, Math.round(x.count / maxLoad * 100), x.count)).join('')
    : emptyState('Nenhum cliente em aberto no momento.');
}
