/* Tela: Follow-up de leads */
function renderLeadsTable(){
  $('#leadTotal').textContent = leads.length;
  $('#leadDue').textContent = leads.filter(l=>leadAging(l).level==='atrasado').length;

  const sorted = [...leads].sort((a,b)=>{
    const aOver = leadAging(a).level==='atrasado' ? 0 : 1;
    const bOver = leadAging(b).level==='atrasado' ? 0 : 1;
    if(aOver!==bOver) return aOver-bOver;
    return (a.followUpDate||'9999').localeCompare(b.followUpDate||'9999');
  });

  $('#leadsTableWrap').innerHTML = sorted.length ? `
    <table>
      <thead><tr><th>Lead</th><th>Interesse</th><th>Contato inicial</th><th>Status</th><th>Observação</th></tr></thead>
      <tbody>
        ${sorted.map(l=>{
          const aging = leadAging(l);
          return `<tr class="client-row" data-lead-id="${l.id}">
            <td><div class="cell-name">${escapeHtml(l.name)}</div><div class="cell-sub">${escapeHtml(l.whatsapp||'sem whatsapp')}</div></td>
            <td><span class="combo-tag">${comboLabel(l.combo)}</span></td>
            <td class="mono" style="color:var(--text-dim);">${fmtDate(l.contactDate)}</td>
            <td><span class="aging-badge ${aging.level}">${aging.label}</span></td>
            <td class="cell-sub" style="max-width:220px;">${escapeHtml(l.notes||'—')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>` : `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>
      <p>Nenhum lead guardado pra chamar depois.</p>
      <button class="new-client-btn" onclick="document.getElementById('btnNewLead').click()">+ Novo lead</button>
    </div>`;

  $$('#leadsTableWrap .client-row').forEach(row=>{
    row.addEventListener('click', ()=>openLeadModal(leads.find(l=>l.id===row.dataset.leadId)));
  });
}
