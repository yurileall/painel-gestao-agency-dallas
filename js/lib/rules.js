/* Regras de prazo e de mudança de status. */
import { STATUS_ORDER } from '../constants.js';
import { daysBetween, todayISO } from './dates.js';

/** @typedef {import('./mappers.js').Client} Client */
/** @typedef {import('./mappers.js').Lead} Lead */

/**
 * Idade do projeto frente ao prazo (SLA).
 * Em aberto: conta da venda até hoje. Entregue: da venda até a entrega.
 * @param {Client} client
 * @param {number} slaDays
 * @param {string} [today]
 * @returns {{ days: number, level: 'ok'|'atencao'|'atrasado' }}
 */
export function agingInfo(client, slaDays, today = todayISO()){
  const delivered = client.status === 'entregue';
  const days = daysBetween(client.saleDate, delivered ? (client.deliveredDate || today) : today);
  let level = 'ok';
  if(days > slaDays) level = 'atrasado';
  else if(!delivered && days === slaDays) level = 'atencao';
  return { days, level };
}

/**
 * @param {Lead} lead
 * @param {string} [today]
 * @returns {{ level: 'ok'|'atencao'|'atrasado', label: string }}
 */
export function leadAging(lead, today = todayISO()){
  if(lead.followUpDate){
    const left = daysBetween(today, lead.followUpDate);
    if(left < 0) return { level:'atrasado', label:`atrasado ${-left}d` };
    if(left === 0) return { level:'atrasado', label:'chamar hoje' };
    if(left === 1) return { level:'atencao', label:'chamar amanhã' };
    return { level:'ok', label:`chamar em ${left}d` };
  }
  return { level:'ok', label:`${daysBetween(lead.contactDate, today)}d sem contato` };
}

/**
 * Ajusta as datas que dependem do status: início da produção é carimbado uma
 * vez só; data de entrega existe apenas enquanto o status for "entregue".
 * @param {Client} client
 * @param {string} [today]
 * @returns {Client} cópia ajustada
 */
export function applyStatusDates(client, today = todayISO()){
  const c = { ...client };
  if((c.status === 'em_producao' || c.status === 'entregue') && !c.producaoStartDate) c.producaoStartDate = today;
  if(c.status === 'entregue'){
    if(!c.deliveredDate) c.deliveredDate = today;
  }else{
    c.deliveredDate = null;
  }
  return c;
}

/**
 * @param {string} status
 * @param {'fwd'|'back'} dir
 * @returns {string|null} status vizinho no pipeline, ou null na ponta
 */
export function adjacentStatus(status, dir){
  const idx = STATUS_ORDER.indexOf(status);
  if(idx < 0) return null;
  return STATUS_ORDER[dir === 'fwd' ? idx + 1 : idx - 1] || null;
}
