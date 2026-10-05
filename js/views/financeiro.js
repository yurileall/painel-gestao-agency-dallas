/* Tela: Financeiro */
import { COMBOS } from '../constants.js';
import { state } from '../store.js';
import { removeAdSpend, setAdSpend } from '../data/ad-spend.js';
import { monthKey, monthLabel, todayISO } from '../lib/dates.js';
import { fmtBRL } from '../lib/format.js';
import { financeStats } from '../lib/stats.js';
import { $, barRow, toast } from '../ui/dom.js';

const wrap = $('#spendTableWrap');
const fmtRoas = roas => roas === null ? '—' : roas.toFixed(2) + 'x';

export function renderFinanceiro(){
  const s = financeStats(state.clients, state.adSpend, monthKey(todayISO()));

  $('#finRevenue').textContent = fmtBRL(s.totalRevenue);
  $('#finSpend').textContent = fmtBRL(s.totalSpend);
  $('#finCpa').textContent = s.cpa === null ? '—' : fmtBRL(s.cpa);
  $('#finRoas').textContent = fmtRoas(s.roas);

  wrap.innerHTML = `
    <table>
      <thead><tr><th>Mês</th><th>Vendas</th><th>Faturamento</th><th>Gasto c/ tráfego</th><th>CPA</th><th>Lucro</th><th>ROAS</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>
        ${s.months.map(m => {
          const label = monthLabel(m.month);
          return `<tr>
            <td class="cell-name">${label}</td>
            <td data-label="Vendas" class="mono">${m.deals}</td>
            <td data-label="Faturamento" class="mono">${fmtBRL(m.revenue)}</td>
            <td data-label="Gasto c/ tráfego"><input type="number" class="inline-input" data-spend-month="${m.month}" data-fk="spend:${m.month}" min="0" step="0.01" value="${m.spend || ''}" placeholder="0,00" aria-label="Gasto com tráfego em ${label}"></td>
            <td data-label="CPA" class="mono dim">${m.cpa === null ? '—' : fmtBRL(m.cpa)}</td>
            <td data-label="Lucro" class="mono ${m.profit >= 0 ? 'pos' : 'neg'}">${fmtBRL(m.profit)}</td>
            <td data-label="ROAS" class="mono dim">${fmtRoas(m.roas)}</td>
            <td data-label="Remover"><button type="button" class="remove-month" data-remove-month="${m.month}" data-fk="rm:${m.month}" title="Remover gasto de ${label}" aria-label="Remover gasto de ${label}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  const maxCombo = Math.max(...Object.values(s.byCombo), 1);
  $('#revenueByCombo').innerHTML = Object.keys(COMBOS).map(k =>
    barRow(COMBOS[k].label, Math.round(s.byCombo[k] / maxCombo * 100), fmtBRL(s.byCombo[k]), 'wide')).join('');
}

/** Mostra o erro e redesenha, para a tabela voltar a refletir o que está salvo. */
function failed(action, res){
  toast(`Não foi possível ${action}: ${res.message}`, 'error');
  renderFinanceiro();
}

wrap.addEventListener('change', async e => {
  const input = e.target.closest('[data-spend-month]');
  if(!input) return;
  const month = input.dataset.spendMonth;
  const text = input.value.trim();
  const amount = Number(text);
  if(text !== '' && (!Number.isFinite(amount) || amount < 0)){
    toast('O gasto precisa ser um número igual ou maior que zero.', 'error');
    input.value = state.adSpend[month] || '';
    return;
  }
  const res = text === '' ? await removeAdSpend(month) : await setAdSpend(month, amount);
  if(!res.ok) failed('salvar o gasto', res);
});

wrap.addEventListener('click', async e => {
  const btn = e.target.closest('[data-remove-month]');
  if(!btn || !(btn.dataset.removeMonth in state.adSpend)) return;
  const res = await removeAdSpend(btn.dataset.removeMonth);
  if(!res.ok) failed('remover o mês', res);
});

$('#btnAddSpendMonth').addEventListener('click', async () => {
  const picker = $('#addSpendMonth');
  const month = picker.value;
  if(!month){ picker.focus(); return; }
  if(!(month in state.adSpend)){
    const res = await setAdSpend(month, 0);
    if(!res.ok){ failed('adicionar o mês', res); return; }
  }
  picker.value = '';
});
