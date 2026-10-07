/* Cálculos das telas. Funções puras: recebem os dados e devolvem números, sem tocar no DOM. */
import { COMBOS, DEFAULT_SLA_DAYS } from '../constants.js';
import { daysBetween, monthKey, todayISO } from './dates.js';
import { agingInfo } from './rules.js';

/** @typedef {import('./mappers.js').Client} Client */

const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
const bySaleDate = (a, b) => (a.saleDate || '').localeCompare(b.saleDate || '');
const zeroPerCombo = () => Object.fromEntries(Object.keys(COMBOS).map(k => [k, 0]));

/** @param {Client[]} clients @returns {string[]} meses com venda, do mais recente ao mais antigo */
export function availableMonths(clients){
  return [...new Set(clients.map(c => monthKey(c.saleDate)).filter(Boolean))].sort().reverse();
}

/**
 * @param {Client[]} clients
 * @param {string} month "AAAA-MM" ou '' para todo o período
 */
export function dashboardStats(clients, month){
  const inPeriod = clients.filter(c => !month || monthKey(c.saleDate) === month);
  const revenue = sum(inPeriod, c => c.price || 0);
  const comboCounts = zeroPerCombo();
  inPeriod.forEach(c => (c.combo || []).forEach(k => { comboCounts[k] = (comboCounts[k] || 0) + 1; }));
  return {
    delivered: inPeriod.filter(c => c.status === 'entregue').length,
    revenue,
    deals: inPeriod.length,
    avgTicket: inPeriod.length ? revenue / inPeriod.length : 0,
    recent: [...inPeriod].sort((a, b) => bySaleDate(b, a)).slice(0, 6),
    comboCounts,
  };
}

/**
 * @param {Client[]} clients
 * @param {string} [today]
 * @returns {{ byStatus: Object<string, Client[]>, active: number, late: number, avgDeliveryDays: number|null, slaRate: number|null }}
 */
export function pipelineStats(clients, today = todayISO()){
  const byStatus = { pendente:[], em_producao:[], entregue:[] };
  clients.forEach(c => byStatus[c.status]?.push(c));
  Object.values(byStatus).forEach(list => list.sort(bySaleDate));

  const open = [...byStatus.pendente, ...byStatus.em_producao];
  const delivered = byStatus.entregue.filter(c => c.deliveredDate);
  const deliveryDays = delivered.map(c => daysBetween(c.saleDate, c.deliveredDate));
  return {
    byStatus,
    active: open.length,
    late: open.filter(c => agingInfo(c, c.slaDays || DEFAULT_SLA_DAYS, today).level === 'atrasado').length,
    avgDeliveryDays: delivered.length ? sum(deliveryDays, d => d) / delivered.length : null,
    slaRate: delivered.length
      ? Math.round(delivered.filter((c, i) => deliveryDays[i] <= (c.slaDays || DEFAULT_SLA_DAYS)).length / delivered.length * 100)
      : null,
  };
}

/**
 * @param {Client[]} clients
 * @param {Object<string, number>} adSpend gasto por mês ("AAAA-MM" → valor)
 * @param {string} currentMonth sempre aparece na tabela, mesmo sem venda
 */
export function financeStats(clients, adSpend, currentMonth){
  const revenue = {}, deals = {};
  clients.forEach(c => {
    const k = monthKey(c.saleDate);
    if(!k) return;
    revenue[k] = (revenue[k] || 0) + (c.price || 0);
    deals[k] = (deals[k] || 0) + 1;
  });

  const keys = [...new Set([...Object.keys(revenue), ...Object.keys(adSpend), currentMonth])].filter(Boolean).sort().reverse();
  const months = keys.map(month => {
    const rev = revenue[month] || 0, n = deals[month] || 0, spend = Number(adSpend[month]) || 0;
    return {
      month, deals: n, revenue: rev, spend,
      cpa: n > 0 && spend > 0 ? spend / n : null,
      profit: rev - spend,
      roas: spend > 0 ? rev / spend : null,
    };
  });

  const totalRevenue = sum(Object.values(revenue), v => v);
  const totalSpend = sum(Object.values(adSpend), v => Number(v) || 0);
  const byCombo = zeroPerCombo();
  clients.forEach(c => {
    const items = c.combo || [];
    const perItem = items.length ? (c.price || 0) / items.length : 0; // divide quando o cliente tem mais de um item
    items.forEach(k => { byCombo[k] = (byCombo[k] || 0) + perItem; });
  });

  return {
    months,
    totalRevenue,
    totalSpend,
    cpa: clients.length > 0 && totalSpend > 0 ? totalSpend / clients.length : null,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : null,
    byCombo,
  };
}

/** @param {Client[]} clients */
export function operationMetrics(clients){
  const started = clients.filter(c => c.producaoStartDate);
  const finished = clients.filter(c => c.producaoStartDate && c.deliveredDate);

  const perMonth = {};
  clients.forEach(c => { const k = monthKey(c.saleDate); if(k) perMonth[k] = (perMonth[k] || 0) + 1; });

  const perOwner = {};
  clients.filter(c => c.status !== 'entregue' && c.owner).forEach(c => { perOwner[c.owner] = (perOwner[c.owner] || 0) + 1; });

  return {
    total: clients.length,
    avgWaitDays: started.length ? sum(started, c => daysBetween(c.saleDate, c.producaoStartDate)) / started.length : null,
    avgProductionDays: finished.length ? sum(finished, c => daysBetween(c.producaoStartDate, c.deliveredDate)) / finished.length : null,
    finishRate: clients.length ? Math.round(clients.filter(c => c.status === 'entregue').length / clients.length * 100) : null,
    byMonth: Object.keys(perMonth).sort().map(month => ({ month, count: perMonth[month] })),
    ownerLoad: Object.keys(perOwner).map(owner => ({ owner, count: perOwner[owner] })),
  };
}
