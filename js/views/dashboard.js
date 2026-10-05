/* Tela: Dashboard */
// ---------- RENDER ----------
function populateMonthFilter(){
  const sel = $('#monthFilter');
  const months = Array.from(new Set(clients.map(c=>monthKey(c.saleDate)).filter(Boolean))).sort().reverse();
  const current = sel.value;
  sel.innerHTML = '<option value="">Todo o período</option>' + months.map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join('');
  if(months.includes(current)) sel.value = current;
}

function renderDashboard(){
  const monthSel = $('#monthFilter').value;
  const inPeriod = clients.filter(c=> !monthSel || monthKey(c.saleDate)===monthSel);
  const delivered = inPeriod.filter(c=>c.status==='entregue');
  const revenue = inPeriod.reduce((s,c)=>s+(c.price||0),0);
  const active = inPeriod.filter(c=>c.status!=='entregue').length;
  const avg = inPeriod.length ? revenue/inPeriod.length : 0;

  $('#kpiDelivered').textContent = delivered.length;
  $('#kpiRevenue').innerHTML = fmtBRL(revenue);
  $('#kpiDeals').textContent = inPeriod.length;
  $('#kpiAvg').innerHTML = fmtBRL(avg);
  $('#kpiDeliveredSub').textContent = monthSel ? `em ${monthLabel(monthSel)}` : 'em todo o período';

  // recent table
  const recent = [...inPeriod].sort((a,b)=>(b.saleDate||'').localeCompare(a.saleDate||'')).slice(0,6);
  $('#recentTableWrap').innerHTML = recent.length ? `
    <table>
      <thead><tr><th>Cliente</th><th>Combo</th><th>Status</th><th>Data</th></tr></thead>
      <tbody>
        ${recent.map(c=>`
          <tr class="client-row" data-id="${c.id}">
            <td><div class="cell-name">${escapeHtml(c.name)}</div><div class="cell-sub">${escapeHtml(c.niche||'—')}</div></td>
            <td><span class="combo-tag">${comboLabel(c.combo)}</span></td>
            <td>${statusBadge(c.status)}</td>
            <td class="mono" style="color:var(--text-dim);">${fmtDate(c.saleDate)}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : emptyState('Nenhum cliente cadastrado ainda no período.');
  $$('#recentTableWrap .client-row').forEach(row=>{
    row.addEventListener('click', ()=>openModal(clients.find(c=>c.id===row.dataset.id)));
  });

  // combo bars
  const totalCount = inPeriod.length || 1;
  const counts = { basico:0, presenca:0, autoridade:0 };
  inPeriod.forEach(c=> counts[c.combo] = (counts[c.combo]||0)+1);
  $('#comboBars').innerHTML = Object.keys(COMBOS).map(k=>{
    const n = counts[k]||0;
    const pct = Math.round((n/totalCount)*100);
    return `<div class="combo-bar-row">
      <div class="combo-bar-label">${COMBOS[k].label}</div>
      <div class="combo-bar-track"><div class="combo-bar-fill" style="width:${pct}%"></div></div>
      <div class="combo-bar-val">${n}</div>
    </div>`;
  }).join('');
}

$('#monthFilter').addEventListener('change', renderDashboard);
