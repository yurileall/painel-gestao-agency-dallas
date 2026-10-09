/* Tempo real: o que outra pessoa (ou outra aba) grava aparece aqui sem recarregar. */
import { supabaseClient } from '../config.js';
import { applyClientChange } from './clients.js';
import { applyLeadChange } from './leads.js';
import { applyProspectChange } from './prospects.js';
import { applyAdSpendChange } from './ad-spend.js';

/* As tabelas precisam estar na publicação `supabase_realtime` (ver supabase/schema.sql).
   Sem isso o canal conecta mas não entrega eventos, e o painel segue funcionando
   só com a atualização ao voltar para a aba. */
const TABLES = {
  clients: applyClientChange,
  leads: applyLeadChange,
  prospects: applyProspectChange,
  ad_spend: applyAdSpendChange,
};

let channel = null;

/** @param {() => void} onResync chamado ao reconectar, para buscar o que foi perdido enquanto o canal esteve fora */
export function startRealtime(onResync){
  stopRealtime();
  let dropped = false;
  channel = supabaseClient.channel('painel-db');
  for(const [table, apply] of Object.entries(TABLES)){
    channel.on('postgres_changes', { event:'*', schema:'public', table }, apply);
  }
  channel.subscribe(status => {
    if(status === 'SUBSCRIBED'){
      if(dropped){ dropped = false; onResync(); }
    }else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
      dropped = true;
    }
  });
}

export function stopRealtime(){
  if(!channel) return;
  supabaseClient.removeChannel(channel);
  channel = null;
}
