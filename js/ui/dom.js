/* Helpers de DOM e pedaços de HTML reutilizados pelas telas */
import { COMBOS, STATUS_LABELS } from '../constants.js';
import { escapeHtml } from '../lib/format.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => root.querySelectorAll(sel);

export const comboLabel = combo => escapeHtml(COMBOS[combo]?.label || combo || '—');

export function statusBadge(status){
  return `<span class="badge ${escapeHtml(status)}"><span class="badge-dot"></span>${escapeHtml(STATUS_LABELS[status] || status)}</span>`;
}

const ICON_PLUS  = '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/>';
export const ICON_CLOCK = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';

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

/** Barra horizontal usada em combos, evolução mensal e carga por responsável. */
export function barRow(label, pct, value, valueClass = ''){
  return `<div class="combo-bar-row">
    <div class="combo-bar-label">${escapeHtml(label)}</div>
    <div class="combo-bar-track"><div class="combo-bar-fill" style="width:${pct}%"></div></div>
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
