/* Tela: Pipeline (Kanban) */
function kanbanCard(c){
  const { days, level } = agingInfo(c);
  const badgeTxt = c.status==='entregue' ? `pronto em ${days}d` : `${days}d aberto`;
  const isFirst = c.status==='pendente';
  const isLast = c.status==='entregue';
  return `<div class="kanban-card ${level}" data-id="${c.id}">
    <div class="kc-top">
      <span class="cell-name">${escapeHtml(c.name)}</span>
      <span class="aging-badge ${level}">${badgeTxt}</span>
    </div>
    <div class="combo-tag">${comboLabel(c.combo)}</div>
    <div class="kc-foot">
      <span class="mono" style="color:var(--text-dim); font-size:11.5px;">${fmtBRL(c.price)}</span>
      <div class="move-btns">
        ${isFirst ? '' : `<button class="move-btn" data-move="back" data-id="${c.id}" title="Voltar">←</button>`}
        ${isLast ? '' : `<button class="move-btn" data-move="fwd" data-id="${c.id}" title="Avançar">→</button>`}
      </div>
    </div>
  </div>`;
}

function renderPipeline(){
  const byStatus = { pendente:[], em_producao:[], entregue:[] };
  clients.forEach(c=> byStatus[c.status]?.push(c));
  Object.keys(byStatus).forEach(k=> byStatus[k].sort((a,b)=>(a.saleDate||'').localeCompare(b.saleDate||'')));

  $('#countPendente').textContent = byStatus.pendente.length;
  $('#countProducao').textContent = byStatus.em_producao.length;
  $('#countEntregue').textContent = byStatus.entregue.length;

  $('#colPendente').innerHTML = byStatus.pendente.length ? byStatus.pendente.map(kanbanCard).join('') : '<div class="kanban-empty">Nenhum cliente aqui.</div>';
  $('#colProducao').innerHTML = byStatus.em_producao.length ? byStatus.em_producao.map(kanbanCard).join('') : '<div class="kanban-empty">Nenhum cliente aqui.</div>';
  $('#colEntregue').innerHTML = byStatus.entregue.length ? byStatus.entregue.map(kanbanCard).join('') : '<div class="kanban-empty">Nenhum cliente aqui.</div>';

  $$('#kanbanBoard .kanban-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('[data-move]')) return;
      openModal(clients.find(c=>c.id===card.dataset.id));
    });
  });
  $$('#kanbanBoard [data-move]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const c = clients.find(c=>c.id===btn.dataset.id);
      if(!c) return;
      const idx = STATUS_ORDER.indexOf(c.status);
      const targetIdx = btn.dataset.move==='fwd' ? idx+1 : idx-1;
      const target = STATUS_ORDER[targetIdx];
      if(target) moveClientToStatus(btn.dataset.id, target);
    });
  });

  // KPIs
  const active = byStatus.pendente.length + byStatus.em_producao.length;
  const late = [...byStatus.pendente, ...byStatus.em_producao].filter(c=>agingInfo(c).level==='atrasado').length;
  $('#pkTotal').textContent = active;
  $('#pkLate').textContent = late;

  const delivered = byStatus.entregue.filter(c=>c.deliveredDate);
  if(delivered.length){
    const totalDays = delivered.reduce((s,c)=>s+daysBetween(c.saleDate, c.deliveredDate),0);
    const avg = (totalDays/delivered.length).toFixed(1);
    const onTime = delivered.filter(c=>daysBetween(c.saleDate,c.deliveredDate) <= slaDays).length;
    $('#pkAvgTime').innerHTML = `${avg} <span>dias</span>`;
    $('#pkSlaRate').textContent = Math.round((onTime/delivered.length)*100) + '%';
  } else {
    $('#pkAvgTime').innerHTML = '— <span>dias</span>';
    $('#pkSlaRate').textContent = '—%';
  }
}

$('#btnNewClientPipeline').addEventListener('click', ()=>openModal(null));
$('#slaDaysInput').addEventListener('change', async (e)=>{
  const anterior = slaDays;
  slaDays = Math.max(1, parseInt(e.target.value,10) || 3);
  e.target.value = slaDays;
  if(!(await saveSettings())){ slaDays = anterior; e.target.value = anterior; }
  renderPipeline();
});
