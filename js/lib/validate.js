/* Validação dos formulários. Cada função devolve { campo: 'mensagem' }; objeto vazio = válido. */
import { COMBOS, STATUS_ORDER } from '../constants.js';
import { isValidISODate } from './dates.js';

/** @typedef {import('./mappers.js').Client} Client */
/** @typedef {import('./mappers.js').Lead} Lead */

const MAX_NAME = 120;
const MAX_PRICE = 9999999999.99; // limite da coluna numeric(12,2)

/** Completa com https:// quando o usuário digita só "meusite.com". */
export function normalizeUrl(s){
  const url = String(s ?? '').trim();
  if(!url) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : 'https://' + url;
}

/** Só http/https: barra "javascript:" e afins caso o link um dia vire <a href>. */
export function isHttpUrl(s){
  try{
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
  }catch{
    return false;
  }
}

/** @returns {Object<string, import('./mappers.js').Deliverable>} cópia com os links normalizados */
export function normalizeDeliverables(deliverables){
  const out = {};
  for(const [key, val] of Object.entries(deliverables || {})){
    out[key] = (val && typeof val === 'object') ? { done: !!val.done, url: normalizeUrl(val.url) } : !!val;
  }
  return out;
}

function nameError(name){
  if(!name || !name.trim()) return 'Informe o nome.';
  if(name.length > MAX_NAME) return `O nome pode ter no máximo ${MAX_NAME} caracteres.`;
  return null;
}

/* Opcional. Quando preenchido: DDD + número (10 ou 11 dígitos), com ou sem o 55 na frente. */
function whatsappError(whatsapp){
  if(!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13 ? null : 'WhatsApp incompleto. Use DDD + número, ex.: (71) 91234-5678.';
}

/** @param {Client} c */
export function validateClient(c){
  const errors = {};
  const set = (field, msg) => { if(msg) errors[field] = msg; };

  set('name', nameError(c.name));
  set('whatsapp', whatsappError(c.whatsapp));
  if(!COMBOS[c.combo]) set('combo', 'Escolha um combo.');
  if(!STATUS_ORDER.includes(c.status)) set('status', 'Status inválido.');

  if(typeof c.price !== 'number' || !Number.isFinite(c.price)) set('price', 'Informe um valor numérico.');
  else if(c.price < 0) set('price', 'O valor não pode ser negativo.');
  else if(c.price > MAX_PRICE) set('price', 'Valor alto demais.');

  if(!c.saleDate) set('saleDate', 'Informe a data da venda.');
  else if(!isValidISODate(c.saleDate)) set('saleDate', 'Data inválida.');

  for(const val of Object.values(c.deliverables || {})){
    if(val && typeof val === 'object' && val.url && !isHttpUrl(val.url)){
      set('deliverables', `Link inválido: "${val.url}". Use um endereço como https://site.com.`);
      break;
    }
  }
  return errors;
}

/** @param {Lead} l */
export function validateLead(l){
  const errors = {};
  const set = (field, msg) => { if(msg) errors[field] = msg; };

  set('name', nameError(l.name));
  set('whatsapp', whatsappError(l.whatsapp));
  if(l.combo && !COMBOS[l.combo]) set('combo', 'Combo inválido.');

  if(!l.contactDate) set('contactDate', 'Informe a data do contato.');
  else if(!isValidISODate(l.contactDate)) set('contactDate', 'Data inválida.');

  if(l.followUpDate){
    if(!isValidISODate(l.followUpDate)) set('followUpDate', 'Data inválida.');
    else if(l.contactDate && l.followUpDate < l.contactDate) set('followUpDate', 'O retorno não pode ser antes da data do contato.');
  }
  return errors;
}
