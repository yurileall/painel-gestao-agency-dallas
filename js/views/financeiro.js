/* Tela: Financeiro */
function renderFinanceiro(){
  const revByMonth = {};
  const countByMonth = {};
  clients.forEach(c=>{
    const k = monthKey(c.saleDate);
    if(!k) return;
    revByMonth[k] = (revByMonth[k]||0) + (c.price||0);
    countByMonth[k] = (countByMonth[k]||0) + 1;
  });

  const months = Array.from(new Set([...Object.keys(revByMonth), ...Object.keys(adSpend), monthKey(new Date().toISOString().slice(0,10))])).sort().reverse();

  // KPI totals
  const totalRevenue = Object.values(revByMonth).reduce((a,b)=>a+b,0);
  const totalSpend = Object.values(adSpend).reduce((a,b)=>a+(parseFloat(b)||0),0);
  const totalDeals = clients.length;
  $('#finRevenue').innerHTML = fmtBRL(totalRevenue);
  $('#finSpend').innerHTML = fmtBRL(totalSpend);
  $('#finCpa').innerHTML = totalDeals>0 && totalSpend>0 ? fmtBRL(totalSpend/totalDeals) : '—';
  $('#finRoas').textContent = totalSpend>0 ? (totalRevenue/totalSpend).toFixed(2)+'x' : '—';

  // month table
  $('#spendTableWrap').innerHTML = months.length ? `
    <table>
      <thead><tr><th>Mês</th><th>Vendas</th><th>Faturamento</th><th>Gasto c/ tráfego</th><th>CPA</th><th>Lucro</th><th>ROAS</th><th></th></tr></thead>
      <tbody>
        ${months.map(m=>{
          const rev = revByMonth[m]||0;
          const deals = countByMonth[m]||0;
          const spend = parseFloat(adSpend[m]) || 0;
          const cpa = deals>0 && spend>0 ? fmtBRL(spend/deals) : '—';
          const profit = rev - spend;
          const roas = spend>0 ? (rev/spend).toFixed(2)+'x' : '—';
          return `<tr>
            <td class="cell-name">${monthLabel(m)}</td>
            <td class="mono">${deals}</td>
            <td class="mono">${fmtBRL(rev)}</td>
            <td><input type="number" class="inline-input" data-spend-month="${m}" step="0.01" value="${spend||''}" placeholder="0,00"></td>
            <td class="mono" style="color:var(--text-dim);">${cpa}</td>
            <td class="mono" style="color:${profit>=0?'var(--ok)':'var(--danger)'};">${fmtBRL(profit)}</td>
            <td class="mono" style="color:var(--text-dim);">${roas}</td>
            <td><button class="remove-month" data-remove-month="${m}" title="Remover mês">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>` : emptyState('Nenhum dado ainda. Adicione um mês para lançar o gasto com tráfego.');

  $$('#spendTableWrap [data-spend-month]').forEach(inp=>{
    inp.addEventListener('change', async ()=>{
      const m = inp.dataset.spendMonth;
      const val = parseFloat(inp.value);
      const vazio = !val && val!==0;
      const ok = vazio ? await deleteAdSpendMonth(m) : await saveAdSpendMonth(m, val);
      if(!ok){ renderFinanceiro(); return; }   // recoloca o valor que estava
      if(vazio) delete adSpend[m]; else adSpend[m] = val;
      renderFinanceiro();
    });
  });
  $$('#spendTableWrap [data-remove-month]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const m = btn.dataset.removeMonth;
      if(!(await deleteAdSpendMonth(m))) return;
      delete adSpend[m];
      renderFinanceiro();
    });
  });

  // revenue by combo (all-time)
  const byCombo = { basico:0, presenca:0, autoridade:0 };
  clients.forEach(c=> byCombo[c.combo] = (byCombo[c.combo]||0) + (c.price||0));
  const maxCombo = Math.max(...Object.values(byCombo), 1);
  $('#revenueByCombo').innerHTML = Object.keys(COMBOS).map(k=>{
    const pct = Math.round((byCombo[k]/maxCombo)*100);
    return `<div class="combo-bar-row">
      <div class="combo-bar-label">${COMBOS[k].label}</div>
      <div class="combo-bar-track"><div class="combo-bar-fill" style="width:${pct}%"></div></div>
      <div class="combo-bar-val mono" style="width:80px;">${fmtBRL(byCombo[k])}</div>
    </div>`;
  }).join('');
}

$('#btnAddSpendMonth').addEventListener('click', async ()=>{
  const val = $('#addSpendMonth').value;
  if(!val) return;
  if(val in adSpend){ $('#addSpendMonth').value = ''; return; }
  if(!(await saveAdSpendMonth(val, 0))) return;
  adSpend[val] = 0;
  $('#addSpendMonth').value = '';
  renderFinanceiro();
});
