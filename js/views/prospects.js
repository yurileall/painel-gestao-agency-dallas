/* Tela: Prospecção (perfis do Instagram abordados no 1x1) */
import { PROSPECT_CHANNELS, PROSPECT_STATUS_LABELS, PROSPECT_STATUS_ORDER, SCENARIOS } from '../constants.js';
import { state } from '../store.js';
import { escapeHtml, fmtDate } from '../lib/format.js';
import { prospectAging } from '../lib/rules.js';
import { prospectStats } from '../lib/stats.js';
import { normalizeHandle } from '../lib/validate.js';
import { $, ICON_SEND, avatar, emptyState, statusBadge } from '../ui/dom.js';
import { openProspectModal } from '../ui/prospect-modal.js';

const wrap = $('#prospectsTableWrap');
const searchInput = $('#prospectSearch');
const statusFilter = $('#prospectStatusFilter');
const scenarioFilter = $('#prospectScenarioFilter');

statusFilter.innerHTML = '<option value="">Todos os status</option>'
  + PROSPECT_STATUS_ORDER.map(s => `<option value="${s}">${escapeHtml(PROSPECT_STATUS_LABELS[s])}</option>`).join('');
scenarioFilter.innerHTML = '<option value="">Todos os cenários</option>'
  + Object.keys(SCENARIOS).map(k => `<option value="${k}">Cenário ${k}</option>`).join('');

const URGENCY = { atrasado:0, atencao:1, ok:2 };

function scenarioTag(key){
  const scenario = SCENARIOS[key];
  return scenario ? `<span class="combo-tag" title="${escapeHtml(scenario.sees)}">${escapeHtml(key)}</span>` : '—';
}

function nextStepCell(p, aging){
  const badge = aging.label ? `<span class="aging-badge ${aging.level}">${escapeHtml(aging.label)}</span>` : '';
  return `<span class="next-step">${escapeHtml(p.nextStep || (badge ? '' : '—'))}${badge}</span>`;
}

export function renderProspects(){
  const stats = prospectStats(state.prospects);
  $('#prospectTotal').textContent = stats.total;
  $('#prospectTotalSub').textContent = stats.toApproach ? `${stats.toApproach} ainda sem mensagem` : 'todos já receberam mensagem';
  $('#prospectWaiting').textContent = stats.waiting;
  $('#prospectReplyRate').textContent = stats.replyRate == null ? '—%' : stats.replyRate + '%';
  $('#prospectReplySub').textContent = `${stats.replied} de ${stats.contacted} abordados responderam`;
  $('#prospectDue').textContent = stats.due;

  const search = searchInput.value.trim().toLowerCase();
  const handleSearch = normalizeHandle(search); // "@dra.exemplo" ou o link colado também acham o perfil
  const status = statusFilter.value;
  const scenario = scenarioFilter.value;
  const matchesSearch = p => p.handle.includes(handleSearch) || (p.niche || '').toLowerCase().includes(search);

  const rows = state.prospects
    .filter(p => (!search || matchesSearch(p)) && (!status || p.status === status) && (!scenario || p.scenario === scenario))
    .map(prospect => ({ prospect, aging: prospectAging(prospect) }));
  // o que está na hora de fazer primeiro; depois, na ordem do funil e da mensagem mais recente
  rows.sort((a, b) => URGENCY[a.aging.level] - URGENCY[b.aging.level]
    || PROSPECT_STATUS_ORDER.indexOf(a.prospect.status) - PROSPECT_STATUS_ORDER.indexOf(b.prospect.status)
    || (b.prospect.firstMsgDate || '').localeCompare(a.prospect.firstMsgDate || ''));

  wrap.innerHTML = rows.length ? `
    <table>
      <thead><tr><th>@Perfil</th><th>Cenário</th><th>Canal</th><th>Data msg 1</th><th>Status</th><th>Próximo passo</th></tr></thead>
      <tbody>
        ${rows.map(({ prospect: p, aging }) => `
          <tr class="client-row" data-prospect-id="${escapeHtml(p.id)}">
            <td><div class="client-cell">${avatar(p.handle)}<div>
              <button type="button" class="row-link" data-fk="open:${escapeHtml(p.id)}">@${escapeHtml(p.handle)}</button>
              <div class="cell-sub">${escapeHtml(`${p.niche || 'sem nicho'} · ${p.whatsapp || 'sem whatsapp'}`)} · <a class="cell-link" href="https://www.instagram.com/${encodeURIComponent(p.handle)}/" target="_blank" rel="noopener">abrir perfil</a></div>
            </div></div></td>
            <td data-label="Cenário">${scenarioTag(p.scenario)}</td>
            <td data-label="Canal">${escapeHtml(PROSPECT_CHANNELS[p.channel] || '—')}</td>
            <td data-label="Data msg 1" class="mono dim">${fmtDate(p.firstMsgDate)}</td>
            <td data-label="Status">${statusBadge(p.status, PROSPECT_STATUS_LABELS)}</td>
            <td data-label="Próximo passo" class="cell-notes">${nextStepCell(p, aging)}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : state.prospects.length
      ? emptyState('Nenhum perfil encontrado com esses filtros.', { action:null, icon:ICON_SEND })
      : emptyState('Nenhum perfil na lista ainda. Anote aqui cada pessoa que você chamar no 1x1.', { action:'new-prospect', label:'+ Novo perfil', icon:ICON_SEND });

  $('#scenariosTableWrap').innerHTML = `
    <table>
      <thead><tr><th>O que você vê na bio</th><th>Gancho</th><th>Perfis</th></tr></thead>
      <tbody>
        ${Object.entries(SCENARIOS).map(([key, s]) => `
          <tr>
            <td><span class="combo-tag scenario-key">${escapeHtml(key)}</span>${escapeHtml(s.sees)}</td>
            <td data-label="Gancho" class="dim">${escapeHtml(s.hook)}</td>
            <td data-label="Perfis" class="mono">${stats.byScenario[key]}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// espera o usuário parar de digitar antes de refazer a tabela
let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderProspects, 150);
});
statusFilter.addEventListener('change', renderProspects);
scenarioFilter.addEventListener('change', renderProspects);

wrap.addEventListener('click', e => {
  if(e.target.closest('a')) return; // "abrir perfil" leva ao Instagram, não ao modal
  const row = e.target.closest('.client-row');
  if(row) openProspectModal(state.prospects.find(p => p.id === row.dataset.prospectId));
});
