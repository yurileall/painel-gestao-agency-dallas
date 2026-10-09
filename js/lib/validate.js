/* Validação dos formulários. Cada função devolve { campo: 'mensagem' }; objeto vazio = válido. */
import { COMBOS, PROSPECT_CHANNELS, PROSPECT_STATUS_ORDER, SCENARIOS, STATUS_ORDER } from '../constants.js';
import { isValidISODate } from './dates.js';

/** @typedef {import('./mappers.js').Client} Client */
/** @typedef {import('./mappers.js').Lead} Lead */
/** @typedef {import('./mappers.js').Prospect} Prospect */

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

/** Aceita "@Dra.Exemplo" ou o link do perfil colado do Instagram; devolve "dra.exemplo". */
export function normalizeHandle(s){
  const text = String(s ?? '').trim();
  const fromUrl = text.match(/instagram\.com\/([^/?#\s]+)/i);
  return (fromUrl ? fromUrl[1] : text).replace(/^@+/, '').toLowerCase();
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

/* Um combo fechado é exclusivo; itens avulsos podem ser combinados entre si, mas não com um combo. */
function comboError(combo){
  if(!Array.isArray(combo) || !combo.length || !combo.every(k => COMBOS[k])) return 'Escolha um combo ou ao menos um item avulso.';
  const kinds = new Set(combo.map(k => COMBOS[k].kind));
  if(kinds.has('combo') && combo.length > 1) return 'Escolha só um combo, ou use itens avulsos em vez dele.';
  if(kinds.size > 1) return 'Não dá para combinar um combo com itens avulsos.';
  return null;
}

/** @param {Client} c */
export function validateClient(c){
  const errors = {};
  const set = (field, msg) => { if(msg) errors[field] = msg; };

  set('name', nameError(c.name));
  set('whatsapp', whatsappError(c.whatsapp));
  set('combo', comboError(c.combo));
  if(!STATUS_ORDER.includes(c.status)) set('status', 'Status inválido.');

  if(typeof c.price !== 'number' || !Number.isFinite(c.price)) set('price', 'Informe um valor numérico.');
  else if(c.price < 0) set('price', 'O valor não pode ser negativo.');
  else if(c.price > MAX_PRICE) set('price', 'Valor alto demais.');

  if(!c.saleDate) set('saleDate', 'Informe a data da venda.');
  else if(!isValidISODate(c.saleDate)) set('saleDate', 'Data inválida.');

  if(!Number.isInteger(c.slaDays) || c.slaDays < 1 || c.slaDays > 365) set('slaDays', 'Informe um prazo entre 1 e 365 dias.');

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

/**
 * @param {Prospect} p com o handle já normalizado (ver normalizeHandle)
 * @param {Prospect[]} [existing] perfis já cadastrados, para não abordar a mesma pessoa duas vezes
 */
export function validateProspect(p, existing = []){
  const errors = {};
  const set = (field, msg) => { if(msg) errors[field] = msg; };

  // regra do próprio Instagram: letras, números, ponto e sublinhado, até 30 caracteres
  if(!p.handle) set('handle', 'Informe o @ do perfil.');
  else if(!/^[a-z0-9._]{1,30}$/.test(p.handle)) set('handle', 'Use o @ do perfil, ex.: @dra.exemplo.');
  else if(existing.some(x => x.id !== p.id && x.handle === p.handle)) set('handle', 'Esse perfil já está na lista.');

  set('whatsapp', whatsappError(p.whatsapp));
  if(p.scenario && !SCENARIOS[p.scenario]) set('scenario', 'Cenário inválido.');
  if(!PROSPECT_CHANNELS[p.channel]) set('channel', 'Canal inválido.');
  if(!PROSPECT_STATUS_ORDER.includes(p.status)) set('status', 'Status inválido.');

  if(p.firstMsgDate){
    if(!isValidISODate(p.firstMsgDate)) set('firstMsgDate', 'Data inválida.');
  }else if(p.status !== 'a_abordar'){
    set('firstMsgDate', 'Informe a data da primeira mensagem.');
  }

  if(p.nextStepDate && !isValidISODate(p.nextStepDate)) set('nextStepDate', 'Data inválida.');
  return errors;
}
