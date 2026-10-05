/* Datas no formato ISO (AAAA-MM-DD), sempre no fuso do navegador. */

const DAY_MS = 86400000;
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/**
 * Data de hoje no fuso local.
 * Não usar `toISOString()`: ele devolve UTC, e no Brasil depois das 21h já seria "amanhã".
 * @param {Date} [now]
 * @returns {string} AAAA-MM-DD
 */
export function todayISO(now = new Date()){
  const p = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** @param {unknown} s @returns {boolean} true se for uma data real no formato AAAA-MM-DD */
export function isValidISODate(s){
  if(typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toUTC(iso){
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Dias corridos entre duas datas (dia de calendário, sem hora).
 * @param {string|null} from AAAA-MM-DD
 * @param {string|null} [to] AAAA-MM-DD; hoje quando omitido
 * @returns {number} 0 quando `from` é vazio
 */
export function daysBetween(from, to){
  if(!from) return 0;
  return Math.round((toUTC(to || todayISO()) - toUTC(from)) / DAY_MS);
}

/** @param {string|null} iso @returns {string} "AAAA-MM" ou '' */
export const monthKey = iso => iso ? iso.slice(0, 7) : '';

/** @param {string} key "AAAA-MM" @returns {string} "Out/2026" */
export function monthLabel(key){
  if(!key) return '';
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]}/${y}`;
}
