/* Gasto com tráfego pago por mês */
import { supabaseClient } from '../config.js';
import { state, notify } from '../store.js';
import { run } from './db.js';

export async function loadAdSpend(){
  const res = await run('Falha ao carregar gasto com tráfego', () => supabaseClient.from('ad_spend').select('month, amount'));
  if(res.ok){
    state.adSpend = {};
    (res.data || []).forEach(r => { state.adSpend[r.month] = Number(r.amount) || 0; });
    notify();
  }
  return res;
}

/** @param {string} month "AAAA-MM" @param {number} amount */
export async function setAdSpend(month, amount){
  const res = await run('Falha ao salvar gasto com tráfego',
    () => supabaseClient.from('ad_spend').upsert({ month, amount }, { onConflict:'month' }));
  if(res.ok){ state.adSpend[month] = amount; notify(); }
  return res;
}

/** @param {string} month "AAAA-MM" */
export async function removeAdSpend(month){
  const res = await run('Falha ao remover gasto com tráfego', () => supabaseClient.from('ad_spend').delete().eq('month', month));
  if(res.ok){ delete state.adSpend[month]; notify(); }
  return res;
}

export function applyAdSpendChange(payload){
  if(payload.eventType === 'DELETE') delete state.adSpend[payload.old.month];
  else state.adSpend[payload.new.month] = Number(payload.new.amount) || 0;
  notify();
}
