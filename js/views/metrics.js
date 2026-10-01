/* Tela: Métricas */
function renderMetrics(){
  $('#metTotal').textContent = clients.length;

  const withProdStart = clients.filter(c=>c.producaoStartDate);
  if(withProdStart.length){
    const avgWait = withProdStart.reduce((s,c)=>s+daysBetween(c.saleDate,c.producaoStartDate),0)/withProdStart.length;
    $('#metWait').innerHTML = `${avgWait.toFixed(1)} <span>dias</span>`;
  } else {
    $('#metWait').innerHTML = '— <span>dias</span>';
  }

  const withBothDates = clients.filter(c=>c.producaoStartDate && c.deliveredDate);
  if(withBothDates.length){
    const avgProd = withBothDates.reduce((s,c)=>s+daysBetween(c.producaoStartDate,c.deliveredDate),0)/withBothDates.length;
    $('#metProd').innerHTML = `${avgProd.toFixed(1)} <span>dias</span>`;
  } else {
    $('#metProd').innerHTML = '— <span>dias</span>';
  }

  const finishedCount = clients.filter(c=>c.status==='entregue').length;
  $('#metFinish').textContent = clients.length ? Math.round((finishedCount/clients.length)*100)+'%' : '—%';

  // evolução mensal
  const byMonth = {};
  clients.forEach(c=>{ const k=monthKey(c.saleDate); if(!k) return; byMonth[k]=(byMonth[k]||0)+1; });
  const monthsSorted = Object.keys(byMonth).sort();
  const maxCount = Math.max(...Object.values(byMonth), 1);
  $('#metMonthly').innerHTML = monthsSorted.length ? monthsSorted.map(m=>{
    const pct = Math.round((byMonth[m]/maxCount)*100);
    return `<div class="combo-bar-row">
      <div class="combo-bar-label">${monthLabel(m)}</div>
      <div class="combo-bar-track"><div class="combo-bar-fill" style="width:${pct}%"></div></div>
      <div class="combo-bar-val">${byMonth[m]}</div>
    </div>`;
  }).join('') : emptyState('Sem vendas registradas ainda.');

  // carga por responsável (em aberto)
  const open = clients.filter(c=>c.status!=='entregue');
  const owners = Array.from(new Set(open.map(c=>c.owner).filter(Boolean)));
  const maxLoad = Math.max(...owners.map(o=>open.filter(c=>c.owner===o).length), 1);
  $('#metOwnerLoad').innerHTML = owners.length ? owners.map(o=>{
    const n = open.filter(c=>c.owner===o).length;
    const pct = Math.round((n/maxLoad)*100);
    return `<div class="combo-bar-row">
      <div class="combo-bar-label">${escapeHtml(o)}</div>
      <div class="combo-bar-track"><div class="combo-bar-fill" style="width:${pct}%"></div></div>
      <div class="combo-bar-val">${n}</div>
    </div>`;
  }).join('') : emptyState('Nenhum cliente em aberto no momento.');
}
