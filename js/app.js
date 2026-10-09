/* Orquestração: desenho da tela ativa, carga inicial, sincronização e relógio */
import { state, subscribe, notify, resetData } from './store.js';
import { loadClients } from './data/clients.js';
import { loadLeads } from './data/leads.js';
import { loadProspects } from './data/prospects.js';
import { loadAdSpend } from './data/ad-spend.js';
import { startRealtime, stopRealtime } from './data/realtime.js';
import { $ } from './ui/dom.js';
import { openClientModal } from './ui/client-modal.js';
import { openLeadModal } from './ui/lead-modal.js';
import { openProspectModal } from './ui/prospect-modal.js';
import './ui/nav.js';
import './ui/theme.js';
import { renderDashboard } from './views/dashboard.js';
import { renderPipeline } from './views/pipeline.js';
import { renderClientsTable } from './views/clients.js';
import { renderFinanceiro } from './views/financeiro.js';
import { renderMetrics } from './views/metrics.js';
import { renderLeadsTable } from './views/leads.js';
import { renderProspects } from './views/prospects.js';

const VIEWS = {
  dashboard: renderDashboard,
  pipeline: renderPipeline,
  prospeccao: renderProspects,
  followup: renderLeadsTable,
  clientes: renderClientsTable,
  financeiro: renderFinanceiro,
  metricas: renderMetrics,
};

/* ---------- DESENHO ----------
   Só a tela visível é redesenhada. As outras são desenhadas quando o usuário
   navega até elas (nav.js chama notify). */
function render(){
  // As telas são refeitas com innerHTML, o que derruba o foco do teclado.
  // Elementos com data-fk ("tipo:id") são reencontrados depois do desenho.
  const active = document.activeElement;
  const key = active?.dataset?.fk;

  VIEWS[state.currentView]?.();

  if(!key || document.activeElement?.dataset?.fk === key) return;
  const byKey = k => document.querySelector(`[data-fk="${CSS.escape(k)}"]`);
  // o botão pode ter sumido (card chegou na última coluna): cai para o nome do item
  const next = byKey(key) || byKey('open:' + key.slice(key.indexOf(':') + 1));
  if(!next) return;
  if(next.matches('input') && active.matches('input')) next.value = active.value; // preserva o que estava sendo digitado
  next.focus();
}

/* Várias notificações seguidas (ex.: as quatro cargas iniciais) viram um desenho só. */
let renderQueued = false;
function scheduleRender(){
  if(renderQueued) return;
  renderQueued = true;
  setTimeout(() => { renderQueued = false; render(); }, 0);
}
subscribe(scheduleRender);

/* ---------- CARGA E SINCRONIZAÇÃO ---------- */
const STALE_AFTER_MS = 60000;
let running = false;
let lastSync = 0;

function showLoadError(msg){
  $('#loadErrorMsg').textContent = msg ? `Não foi possível carregar os dados: ${msg}` : '';
  $('#loadError').hidden = !msg;
}

async function loadAll(){
  const results = await Promise.all([loadAdSpend(), loadClients(), loadLeads(), loadProspects()]);
  if(!running) return;
  lastSync = Date.now();
  showLoadError(results.find(r => !r.ok)?.message || null);
  notify();
}

/** Chamado por auth.js depois de o login ser confirmado. */
export async function startApp(){
  if(running) return;
  running = true;
  document.body.classList.add('loading');
  await loadAll();
  document.body.classList.remove('loading');
  if(running) startRealtime(loadAll);
}

/** Chamado por auth.js ao sair. */
export function stopApp(){
  if(!running) return;
  running = false;
  stopRealtime();
  resetData();
  showLoadError(null);
  notify();
}

$('#btnRetryLoad').addEventListener('click', loadAll);

/* Rede de segurança do tempo real: ao voltar para a aba depois de um tempo,
   busca tudo de novo (o canal pode ter caído com o computador em repouso). */
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState !== 'visible' || !running) return;
  if(Date.now() - lastSync > STALE_AFTER_MS) loadAll();
  else notify(); // os "dias em aberto" mudam quando vira o dia
});

/* ---------- AÇÕES GLOBAIS ---------- */
const ACTIONS = {
  'new-client': () => openClientModal(null),
  'new-lead': () => openLeadModal(null),
  'new-prospect': () => openProspectModal(null),
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if(el) ACTIONS[el.dataset.action]?.();
});

/* ---------- RELÓGIO ---------- */
function tickClock(){
  $('#clock').textContent = new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}
setInterval(tickClock, 30000);
tickClock();
