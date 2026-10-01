/* Orquestração: renderAll, relógio e inicialização */
function renderAll(){
  populateMonthFilter();
  renderDashboard();
  renderPipeline();
  renderClientsTable();
  renderFinanceiro();
  renderMetrics();
  renderLeadsTable();
}


// clock
function tickClock(){
  const now = new Date();
  $('#clock').textContent = now.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}
setInterval(tickClock, 1000*30);
tickClock();

// init — chamado por showApp() somente depois do login confirmado pelo Supabase Auth
async function initApp(){
  await loadSettings();
  $('#slaDaysInput').value = slaDays;
  await loadAdSpend();
  await loadClients();
  await loadLeads();
  renderAll();
}
