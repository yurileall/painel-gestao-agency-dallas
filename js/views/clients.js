/* Tela: Clientes */
function renderClientsTable(){
  const search = $('#searchInput').value.trim().toLowerCase();
  const status = $('#statusFilter').value;
  const combo = $('#comboFilter').value;
  let list = clients.filter(c=>{
    if(search && !(c.name.toLowerCase().includes(search) || (c.niche||'').toLowerCase().includes(search))) return false;
    if(status && c.status!==status) return false;
    if(combo && c.combo!==combo) return false;
    return true;
  }).sort((a,b)=>(b.saleDate||'').localeCompare(a.saleDate||''));

  $('#clientsTableWrap').innerHTML = list.length ? `
    <table>
      <thead><tr><th>Cliente</th><th>Combo</th><th>Responsável</th><th>Valor</th><th>Status</th><th>Data da venda</th></tr></thead>
      <tbody>
        ${list.map(c=>`
          <tr class="client-row" data-id="${c.id}">
            <td><div class="cell-name">${escapeHtml(c.name)}</div><div class="cell-sub">${escapeHtml(c.niche||'—')} · ${escapeHtml(c.whatsapp||'sem whatsapp')}</div></td>
            <td><span class="combo-tag">${comboLabel(c.combo)}</span></td>
            <td>${escapeHtml(c.owner||'—')}</td>
            <td class="mono">${fmtBRL(c.price)}</td>
            <td>${statusBadge(c.status)}</td>
            <td class="mono" style="color:var(--text-dim);">${fmtDate(c.saleDate)}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : emptyState(clients.length ? 'Nenhum cliente encontrado com esses filtros.' : 'Nenhum cliente cadastrado ainda. Comece adicionando o primeiro projeto vendido.');

  $$('#clientsTableWrap .client-row').forEach(row=>{
    row.addEventListener('click', ()=>openModal(clients.find(c=>c.id===row.dataset.id)));
  });
}

$('#searchInput').addEventListener('input', renderClientsTable);
$('#statusFilter').addEventListener('change', renderClientsTable);
$('#comboFilter').addEventListener('change', renderClientsTable);
