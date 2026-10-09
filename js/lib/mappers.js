/* Tipos do domínio e conversão entre o objeto do app (camelCase) e a linha do banco (snake_case). */
import { DEFAULT_SLA_DAYS } from '../constants.js';

/**
 * @typedef {Object} Client
 * @property {string} id                       Gerado no app: "c_mabc123xy" (coluna text, não uuid)
 * @property {string} name
 * @property {string} [whatsapp]
 * @property {string} [niche]
 * @property {string[]} combo                   chaves de COMBOS; um combo fechado sozinho, ou um ou mais itens avulsos
 * @property {number} price
 * @property {string} saleDate                 AAAA-MM-DD → coluna sale_date
 * @property {string} [owner]
 * @property {'pendente'|'em_producao'|'entregue'} status
 * @property {string} [notes]
 * @property {string|null} deliveredDate       AAAA-MM-DD → coluna delivered_date
 * @property {string|null} producaoStartDate   AAAA-MM-DD → coluna producao_start_date
 * @property {number} slaDays                  prazo de entrega em dias → coluna sla_days
 */

/**
 * @typedef {Object} Lead
 * @property {string} id
 * @property {string} name
 * @property {string} [whatsapp]
 * @property {string} [combo]                  '' quando ainda não decidiu
 * @property {string} contactDate              AAAA-MM-DD → coluna contact_date
 * @property {string|null} followUpDate        AAAA-MM-DD → coluna follow_up_date
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Prospect                  Perfil do Instagram abordado no 1x1
 * @property {string} id
 * @property {string} handle                   @ do perfil, sem o "@" e em minúsculas (ver normalizeHandle)
 * @property {string} [whatsapp]
 * @property {string} [niche]
 * @property {string} [scenario]               chave de SCENARIOS; '' quando a bio ainda não foi avaliada
 * @property {string} channel                  chave de PROSPECT_CHANNELS
 * @property {string|null} firstMsgDate        AAAA-MM-DD → coluna first_msg_date; null enquanto estiver "a abordar"
 * @property {string} status                   chave de PROSPECT_STATUS_LABELS
 * @property {string} [nextStep]               → coluna next_step
 * @property {string|null} nextStepDate        AAAA-MM-DD → coluna next_step_date
 */

/** @param {'c'|'l'|'p'} prefix @returns {string} */
export function newId(prefix){
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** @param {Client} c */
export function clientToRow(c){
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp || null,
    niche: c.niche || null,
    combo: Array.isArray(c.combo) ? c.combo.join(',') || null : (c.combo || null), // coluna é text; várias chaves ficam separadas por vírgula
    price: c.price || 0,
    sale_date: c.saleDate || null,
    owner: c.owner || null,
    status: c.status,
    notes: c.notes || null,
    delivered_date: c.deliveredDate || null,
    producao_start_date: c.producaoStartDate || null,
    sla_days: c.slaDays || DEFAULT_SLA_DAYS,
  };
}

/** @returns {Client} */
export function rowToClient(r){
  return {
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    niche: r.niche,
    combo: r.combo ? String(r.combo).split(',').filter(Boolean) : [],
    price: r.price != null ? Number(r.price) : 0,
    saleDate: r.sale_date,
    owner: r.owner,
    status: r.status,
    notes: r.notes,
    deliveredDate: r.delivered_date,
    producaoStartDate: r.producao_start_date,
    slaDays: r.sla_days != null ? Number(r.sla_days) : DEFAULT_SLA_DAYS,
  };
}

/** @param {Lead} l */
export function leadToRow(l){
  return {
    id: l.id,
    name: l.name,
    whatsapp: l.whatsapp || null,
    combo: l.combo || null,
    contact_date: l.contactDate || null,
    follow_up_date: l.followUpDate || null,
    notes: l.notes || null,
  };
}

/** @returns {Lead} */
export function rowToLead(r){
  return {
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    combo: r.combo,
    contactDate: r.contact_date,
    followUpDate: r.follow_up_date,
    notes: r.notes,
  };
}

/** @param {Prospect} p */
export function prospectToRow(p){
  return {
    id: p.id,
    handle: p.handle,
    whatsapp: p.whatsapp || null,
    niche: p.niche || null,
    scenario: p.scenario || null,
    channel: p.channel || null,
    first_msg_date: p.firstMsgDate || null,
    status: p.status,
    next_step: p.nextStep || null,
    next_step_date: p.nextStepDate || null,
  };
}

/** @returns {Prospect} */
export function rowToProspect(r){
  return {
    id: r.id,
    handle: r.handle,
    whatsapp: r.whatsapp,
    niche: r.niche,
    scenario: r.scenario,
    channel: r.channel,
    firstMsgDate: r.first_msg_date,
    status: r.status,
    nextStep: r.next_step,
    nextStepDate: r.next_step_date,
  };
}
