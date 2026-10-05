/* Estado do app em um lugar só. Quem altera chama notify(); a tela ativa se redesenha. */
import { DEFAULT_SLA_DAYS } from './constants.js';

/**
 * @typedef {Object} AppState
 * @property {import('./lib/mappers.js').Client[]} clients
 * @property {import('./lib/mappers.js').Lead[]} leads
 * @property {Object<string, number>} adSpend   gasto com tráfego por mês ("AAAA-MM" → valor)
 * @property {number} slaDays                   prazo de entrega em dias
 * @property {string} currentView               dashboard | pipeline | followup | clientes | financeiro | metricas
 */

/** @type {AppState} */
export const state = {
  clients: [],
  leads: [],
  adSpend: {},
  slaDays: DEFAULT_SLA_DAYS,
  currentView: 'dashboard',
};

const listeners = new Set();

/** @param {() => void} fn */
export function subscribe(fn){ listeners.add(fn); }

export function notify(){ listeners.forEach(fn => fn()); }

/** Limpa os dados ao sair, para não sobrar nada na memória para o próximo login. */
export function resetData(){
  state.clients = [];
  state.leads = [];
  state.adSpend = {};
  state.slaDays = DEFAULT_SLA_DAYS;
}
