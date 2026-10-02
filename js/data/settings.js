/* Configurações do app (SLA) */
import { supabaseClient } from '../config.js';
import { DEFAULT_SLA_DAYS } from '../constants.js';
import { state, notify } from '../store.js';
import { run } from './db.js';

export async function loadSettings(){
  const res = await run('Falha ao carregar configurações',
    () => supabaseClient.from('app_settings').select('sla_days').eq('id', 1).maybeSingle());
  if(res.ok){ state.slaDays = res.data?.sla_days || DEFAULT_SLA_DAYS; notify(); }
  return res;
}

/** @param {number} days */
export async function saveSlaDays(days){
  const res = await run('Falha ao salvar configuração',
    () => supabaseClient.from('app_settings').upsert({ id:1, sla_days:days }, { onConflict:'id' }));
  if(res.ok){ state.slaDays = days; notify(); }
  return res;
}

export function applySettingsChange(payload){
  if(payload.eventType === 'DELETE' || payload.new?.id !== 1) return;
  state.slaDays = payload.new.sla_days || DEFAULT_SLA_DAYS;
  notify();
}
