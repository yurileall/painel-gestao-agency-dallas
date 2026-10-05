/* Modal de cliente (criar, editar, excluir) */
// ---------- MODAL ----------
const overlay = $('#clientOverlay');

/* Lead que vira cliente ao salvar. Guardar o id aqui evita o truque de trocar
   o onclick do botão salvar: aquela troca sobrevivia ao cancelamento e fazia
   o PRÓXIMO cliente cadastrado apagar um lead que ninguém converteu. */
let pendingLeadId = null;

function openModal(client){
  editingId = client ? client.id : null;
  pendingLeadId = null;
  $('#modalTitle').textContent = client ? 'Editar cliente' : 'Novo cliente';
  $('#fName').value = client?.name || '';
  $('#fWhats').value = client?.whatsapp || '';
  $('#fNiche').value = client?.niche || '';
  $('#fPrice').value = client?.price ?? '';
  $('#fDate').value = client?.saleDate || new Date().toISOString().slice(0,10);
  $('#fOwner').value = client?.owner || 'Breno';
  $('#fStatus').value = client?.status || 'pendente';
  $('#fNotes').value = client?.notes || '';
  $('#btnDelete').style.display = client ? 'inline-flex' : 'none';

  const combo = client?.combo || 'presenca';
  pickCombo(combo, !client);
  renderChecklist(client?.deliverables || {}, combo);

  overlay.classList.add('open');
}
function closeModal(){ overlay.classList.remove('open'); editingId=null; pendingLeadId=null; }
$('#closeModal').onclick = closeModal;
$('#btnCancel').onclick = closeModal;
overlay.addEventListener('click', e=>{ if(e.target===overlay) closeModal(); });

$('#btnNewClientTop').onclick = ()=>openModal(null);

let selectedCombo = 'presenca';
function pickCombo(combo, setPrice){
  selectedCombo = combo;
  $$('.combo-opt').forEach(o=>o.classList.toggle('picked', o.dataset.combo===combo));
  if(setPrice) $('#fPrice').value = COMBOS[combo].price.toFixed(2);
}
$$('.combo-opt').forEach(opt=>{
  opt.addEventListener('click', ()=>{
    const keepData = collectChecklistData();
    pickCombo(opt.dataset.combo, true);
    renderChecklist(keepData, opt.dataset.combo);
  });
});

function renderChecklist(existing, combo){
  const list = COMBOS[combo].deliverables;
  const wrap = $('#deliverablesChecklist');
  wrap.innerHTML = list.map(key=>{
    const done = existing[key]?.done ?? existing[key] ?? false;
    const extra = (key==='lp' || key==='painel')
      ? `<input type="text" data-extra="${key}" placeholder="link" value="${existing[key]?.url ? existing[key].url.replace(/"/g,'&quot;') : ''}">`
      : '';
    return `<div class="check-item">
      <input type="checkbox" id="chk_${key}" data-key="${key}" ${done?'checked':''}>
      <label for="chk_${key}">${DELIVERABLE_LABELS[key]}</label>
      ${extra}
    </div>`;
  }).join('');
}
function collectChecklistData(){
  const data = {};
  $$('#deliverablesChecklist .check-item').forEach(item=>{
    const cb = item.querySelector('input[type=checkbox]');
    const key = cb.dataset.key;
    const extraInput = item.querySelector('input[data-extra]');
    data[key] = extraInput ? { done: cb.checked, url: extraInput.value } : cb.checked;
  });
  return data;
}

$('#btnSave').onclick = async ()=>{
  const name = $('#fName').value.trim();
  if(!name){ $('#fName').focus(); return; }
  const client = {
    id: editingId || uid(),
    name,
    whatsapp: $('#fWhats').value.trim(),
    niche: $('#fNiche').value.trim(),
    combo: selectedCombo,
    price: parseFloat($('#fPrice').value) || COMBOS[selectedCombo].price,
    saleDate: $('#fDate').value,
    owner: $('#fOwner').value,
    status: $('#fStatus').value,
    deliverables: collectChecklistData(),
    notes: $('#fNotes').value.trim(),
    deliveredDate: (editingId && clients.find(c=>c.id===editingId)?.deliveredDate) || null,
    producaoStartDate: (editingId && clients.find(c=>c.id===editingId)?.producaoStartDate) || null,
  };
  if((client.status==='em_producao' || client.status==='entregue') && !client.producaoStartDate){
    client.producaoStartDate = new Date().toISOString().slice(0,10);
  }
  if(client.status==='entregue' && !client.deliveredDate){
    client.deliveredDate = new Date().toISOString().slice(0,10);
  }
  if(client.status!=='entregue'){
    client.deliveredDate = null;
  }
  /* Aplica a mudança na lista local, mas só fecha o modal se o banco
     confirmar. Se falhar, desfaz e mantém o formulário aberto com os dados
     digitados, para o usuário não perder o que preencheu. */
  const idx = editingId ? clients.findIndex(c=>c.id===editingId) : -1;
  const anterior = idx >= 0 ? clients[idx] : null;
  if(idx >= 0){ clients[idx] = client; } else { clients.push(client); }

  const btn = $('#btnSave');
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Salvando...';
  const ok = await saveClient(client);
  btn.disabled = false; btn.textContent = label;

  if(!ok){
    if(idx >= 0){ clients[idx] = anterior; } else { clients = clients.filter(c=>c!==client); }
    return false;
  }
  /* Veio do follow-up: só tira o lead depois que o cliente entrou no banco. */
  if(pendingLeadId){
    const leadId = pendingLeadId;
    if(await deleteLead(leadId)) leads = leads.filter(l=>l.id!==leadId);
  }
  closeModal();
  renderAll();
  return true;
};

$('#btnDelete').onclick = async ()=>{
  if(!editingId) return;
  const id = editingId;
  const alvo = clients.find(c=>c.id===id);
  if(!confirm(`Excluir o cliente "${alvo?.name || ''}"? Isso não pode ser desfeito.`)) return;
  /* Só tira da lista local depois que o banco confirmar a exclusão. */
  const ok = await deleteClient(id);
  if(!ok) return;
  clients = clients.filter(c=>c.id!==id);
  closeModal();
  renderAll();
};
