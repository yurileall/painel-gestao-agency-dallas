/* Tela: Pipeline (Kanban) */
import { DEFAULT_SLA_DAYS, STATUS_LABELS } from '../constants.js';
import { state } from '../store.js';
import { moveClient } from '../data/clients.js';
import { escapeHtml, fmtBRL } from '../lib/format.js';
import { adjacentStatus, agingInfo } from '../lib/rules.js';
import { pipelineStats } from '../lib/stats.js';
import { $, $$, avatar, comboLabel, toast } from '../ui/dom.js';
import { openClientModal } from '../ui/client-modal.js';

const board = $('#kanbanBoard');
const COLUMNS = { pendente:['#colPendente','#countPendente'], em_producao:['#colProducao','#countProducao'], entregue:['#colEntregue','#countEntregue'] };

function moveButton(c, dir, arrow){
  const target = adjacentStatus(c.status, dir);
  if(!target) return '';
  const label = `${dir === 'fwd' ? 'Avançar' : 'Voltar'} ${c.name} para ${STATUS_LABELS[target]}`;
  return `<button type="button" class="move-btn" data-move="${dir}" data-fk="${dir}:${escapeHtml(c.id)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${arrow}</button>`;
}

function kanbanCard(c){
  const { days, level } = agingInfo(c, c.slaDays || DEFAULT_SLA_DAYS);
  const badge = c.status === 'entregue' ? `pronto em ${days}d` : `${days}d aberto`;
  return `<div class="kanban-card ${level}" data-id="${escapeHtml(c.id)}">
    <div class="kc-top">
      <button type="button" class="row-link" data-fk="open:${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>
      <span class="aging-badge ${level}">${badge}</span>
    </div>
    <div class="combo-tag">${comboLabel(c.combo)}</div>
    <div class="kc-owner">${c.owner ? `<span class="owner-chip">${avatar(c.owner, 'sm')}${escapeHtml(c.owner)}</span>` : '<span class="dim">Sem responsável</span>'}</div>
    <div class="kc-foot">
      <span class="mono dim kc-price">${fmtBRL(c.price)}</span>
      <div class="move-btns">${moveButton(c, 'back', '←')}${moveButton(c, 'fwd', '→')}</div>
    </div>
  </div>`;
}

export function renderPipeline(){
  const s = pipelineStats(state.clients);

  for(const [status, [col, count]] of Object.entries(COLUMNS)){
    const list = s.byStatus[status];
    $(count).textContent = list.length;
    $(col).innerHTML = list.length ? list.map(kanbanCard).join('') : '<div class="kanban-empty">Nenhum cliente aqui.</div>';
  }

  $('#pkTotal').textContent = s.active;
  $('#pkLate').textContent = s.late;
  $('#pkAvgTime').innerHTML = `${s.avgDeliveryDays === null ? '—' : s.avgDeliveryDays.toFixed(1)} <span>dias</span>`;
  $('#pkSlaRate').textContent = (s.slaRate === null ? '—' : s.slaRate) + '%';
}

async function move(id, target){
  const res = await moveClient(id, target);
  if(res.ok) return;
  renderPipeline(); // reabilita o card, que continua na coluna de origem
  toast(`Não foi possível mover o cliente: ${res.message}`, 'error', { label:'Tentar de novo', run: () => move(id, target) });
}

board.addEventListener('click', e => {
  const card = e.target.closest('.kanban-card');
  if(!card) return;
  const client = state.clients.find(c => c.id === card.dataset.id);
  if(!client) return;

  const moveBtn = e.target.closest('[data-move]');
  if(!moveBtn){ openClientModal(client); return; }

  const target = adjacentStatus(client.status, moveBtn.dataset.move);
  if(!target) return;
  card.setAttribute('aria-busy', 'true');
  $$('.move-btn', card).forEach(b => { b.disabled = true; }); // evita clique duplo enquanto grava
  move(client.id, target);
});
