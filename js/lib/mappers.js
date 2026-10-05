/* Tipos do domínio e conversão entre o objeto do app (camelCase) e a linha do banco (snake_case). */

/**
 * Entregável: `true/false`, ou `{ done, url }` para os que guardam link (ver LINK_DELIVERABLES).
 * @typedef {boolean | { done: boolean, url: string }} Deliverable
 */

/**
 * @typedef {Object} Client
 * @property {string} id                       Gerado no app: "c_mabc123xy" (coluna text, não uuid)
 * @property {string} name
 * @property {string} [whatsapp]
 * @property {string} [niche]
 * @property {'basico'|'presenca'|'autoridade'} combo
 * @property {number} price
 * @property {string} saleDate                 AAAA-MM-DD → coluna sale_date
 * @property {string} [owner]
 * @property {'pendente'|'em_producao'|'entregue'} status
 * @property {Object<string, Deliverable>} deliverables
 * @property {string} [notes]
 * @property {string|null} deliveredDate       AAAA-MM-DD → coluna delivered_date
 * @property {string|null} producaoStartDate   AAAA-MM-DD → coluna producao_start_date
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

/** @param {'c'|'l'} prefix @returns {string} */
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
    combo: c.combo || null,
    price: c.price || 0,
    sale_date: c.saleDate || null,
    owner: c.owner || null,
    status: c.status,
    deliverables: c.deliverables || {},
    notes: c.notes || null,
    delivered_date: c.deliveredDate || null,
    producao_start_date: c.producaoStartDate || null,
  };
}

/** @returns {Client} */
export function rowToClient(r){
  return {
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    niche: r.niche,
    combo: r.combo,
    price: r.price != null ? Number(r.price) : 0,
    saleDate: r.sale_date,
    owner: r.owner,
    status: r.status,
    deliverables: r.deliverables || {},
    notes: r.notes,
    deliveredDate: r.delivered_date,
    producaoStartDate: r.producao_start_date,
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
