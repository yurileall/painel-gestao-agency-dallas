/* Execução de consultas: repetição em falha de rede e resultado padronizado. */
import { dbErrorMessage, isNetworkError } from '../lib/errors.js';

/**
 * Resultado de toda operação de dados. Quem chama PRECISA checar `ok`:
 * a tela só muda depois que o banco confirma.
 * @typedef {{ ok: true } | { ok: false, message: string }} Result
 */

const RETRY_DELAYS_MS = [400, 1200];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Roda a consulta e repete sozinho apenas quando a rede falhou. Toda gravação
 * do painel é por chave (upsert/delete de uma linha), então repetir é seguro.
 * @param {string} context descrição para o console
 * @param {() => PromiseLike<{ data: any, error: any }>} query
 * @returns {Promise<Result & { data?: any }>}
 */
export async function run(context, query){
  for(let attempt = 0; ; attempt++){
    let res;
    try{ res = await query(); }
    catch(e){ res = { data:null, error:e }; }

    if(!res.error) return { ok:true, data:res.data };
    if(isNetworkError(res.error) && attempt < RETRY_DELAYS_MS.length){
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    console.error(context, res.error);
    return { ok:false, message: dbErrorMessage(res.error) };
  }
}
