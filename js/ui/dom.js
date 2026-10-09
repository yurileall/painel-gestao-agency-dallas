/* Helpers de DOM e pedaços de HTML reutilizados pelas telas */
import { COMBOS, STATUS_LABELS } from '../constants.js';
import { escapeHtml } from '../lib/format.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => root.querySelectorAll(sel);

export const comboLabel = combo => {
  const keys = Array.isArray(combo) ? combo : [combo];
  const labels = keys.map(k => COMBOS[k]?.label || k).filter(Boolean);
  return escapeHtml(labels.length ? labels.join(' + ') : '—');
};

/** @param {Object<string, string>} [labels] rótulos do status; por padrão, os do pipeline de clientes */
export function statusBadge(status, labels = STATUS_LABELS){
  return `<span class="badge ${escapeHtml(status)}"><span class="badge-dot"></span>${escapeHtml(labels[status] || status)}</span>`;
}

/* Cores para diferenciar séries (combos, responsáveis). Não usar as de estado: vermelho aqui pareceria alerta. */
const TONES = ['accent', 'ok', 'wait', 'violet', 'pink'];
/** @param {number} i posição da série @returns {string} cor em CSS, ex.: "var(--ok)" */
export const seriesColor = i => `var(--${TONES[Math.max(i, 0) % TONES.length]})`;

/* A cor sai do nome, então a mesma pessoa tem sempre a mesma, no avatar e nas barras. */
function toneOf(name){
  let hash = 0;
  for(const ch of String(name || '').trim()) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}
/** @returns {string} cor em CSS para uma barra identificada por nome (ex.: responsável) */
export const nameColor = name => `var(--${toneOf(name)})`;

/** Círculo com as iniciais. @param {''|'sm'} [size] */
export function avatar(name, size = ''){
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map(w => [...w][0]).join('').toUpperCase() || '—';
  return `<span class="avatar ${size} tone-${toneOf(name)}" aria-hidden="true">${escapeHtml(letters)}</span>`;
}

/** Primeira célula das tabelas de clientes e leads: avatar, nome (abre a linha pelo teclado) e uma linha de apoio. */
export function nameCell(id, name, sub){
  return `<div class="client-cell">${avatar(name)}<div>
    <button type="button" class="row-link" data-fk="open:${escapeHtml(id)}">${escapeHtml(name)}</button>
    <div class="cell-sub">${escapeHtml(sub)}</div>
  </div></div>`;
}

const ICON_PLUS  ='<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/>';
export const ICON_CLOCK = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';
export const ICON_SEND = '<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>';

/**
 * @param {string} msg
 * @param {{ action?: string|null, label?: string, icon?: string }} [opts]
 *   `action` vira data-action no botão (tratado em app.js); null esconde o botão.
 */
export function emptyState(msg, { action = 'new-client', label = '+ Novo cliente', icon = ICON_PLUS } = {}){
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${icon}</svg>
    <p>${escapeHtml(msg)}</p>
    ${action ? `<button type="button" class="new-client-btn" data-action="${action}">${escapeHtml(label)}</button>` : ''}
  </div>`;
}

/**
 * Barra horizontal usada em combos, evolução mensal e carga por responsável.
 * @param {string} [color] cor em CSS (ver seriesColor); sem ela, a barra usa a cor de destaque
 */
export function barRow(label, pct, value, valueClass = '', color = 'var(--accent)'){
  return `<div class="combo-bar-row">
    <div class="combo-bar-label"><span class="bar-dot" style="background:${color}"></span>${escapeHtml(label)}</div>
    <div class="combo-bar-track"><div class="combo-bar-fill" style="width:${pct}%; background:${color}"></div></div>
    <div class="combo-bar-val ${valueClass}">${escapeHtml(value)}</div>
  </div>`;
}

/**
 * Aviso no canto da tela. Erro de gravação não pode ficar só no console: o
 * usuário precisa saber que o que ele acabou de fazer NÃO foi salvo.
 * @param {string} msg
 * @param {''|'ok'|'error'} [type]
 * @param {{ label: string, run: () => void }} [action] botão dentro do aviso (ex.: "Tentar de novo")
 */
export function toast(msg, type = '', action){
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  if(type === 'error') el.setAttribute('role', 'alert');
  el.append(msg);

  const dismiss = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 250); };
  if(action){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => { dismiss(); action.run(); });
    el.append(btn);
  }
  wrap.appendChild(el);
  setTimeout(dismiss, action ? 12000 : type === 'error' ? 7000 : 3500);
}
