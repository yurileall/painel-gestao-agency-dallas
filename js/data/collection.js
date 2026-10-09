/* Leitura e gravação de uma tabela com chave `id` (clientes, leads e prospecção usam a mesma lógica). */
import { supabaseClient } from '../config.js';
import { state, notify } from '../store.js';
import { run } from './db.js';

/**
 * Cada gravação mexe em UMA linha. Nunca regravar a lista inteira nem apagar
 * "o que não está na memória": com duas pessoas usando o painel, isso apagava
 * o que a outra tinha acabado de cadastrar.
 *
 * @param {Object} cfg
 * @param {string} cfg.table     tabela no Supabase
 * @param {'clients'|'leads'|'prospects'} cfg.stateKey  lista correspondente em `state`
 * @param {(item: any) => any} cfg.toRow
 * @param {(row: any) => any} cfg.fromRow
 */
export function createCollection({ table, stateKey, toRow, fromRow }){
  function putLocal(item){
    const list = state[stateKey];
    const idx = list.findIndex(x => x.id === item.id);
    if(idx >= 0) list[idx] = item; else list.push(item);
  }
  function dropLocal(id){
    state[stateKey] = state[stateKey].filter(x => x.id !== id);
  }

  return {
    /** Em caso de falha, mantém o que já estava carregado. */
    async load(){
      const res = await run(`Falha ao carregar ${table}`, () => supabaseClient.from(table).select('*'));
      if(res.ok){ state[stateKey] = (res.data || []).map(fromRow); notify(); }
      return res;
    },

    async save(item){
      const res = await run(`Falha ao salvar em ${table}`, () => supabaseClient.from(table).upsert(toRow(item), { onConflict:'id' }));
      if(res.ok){ putLocal(item); notify(); }
      return res;
    },

    async remove(id){
      const res = await run(`Falha ao excluir de ${table}`, () => supabaseClient.from(table).delete().eq('id', id));
      if(res.ok){ dropLocal(id); notify(); }
      return res;
    },

    /** Mudança feita em outra aba/por outra pessoa, recebida pelo canal de tempo real. */
    applyRemote(payload){
      if(payload.eventType === 'DELETE') dropLocal(payload.old.id);
      else putLocal(fromRow(payload.new));
      notify();
    },
  };
}
