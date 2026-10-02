/* Formatação para exibição. */

/** @param {number|null|undefined} v @returns {string} "R$ 1.234,50" */
export const fmtBRL = v =>
  'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });

/** @param {string|null} iso AAAA-MM-DD @returns {string} "DD/MM/AAAA" ou "—" */
export function fmtDate(iso){
  if(!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const HTML_ESCAPES = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };

/** Tudo que vem do banco ou do usuário passa por aqui antes de entrar em innerHTML. */
export function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, m => HTML_ESCAPES[m]);
}
