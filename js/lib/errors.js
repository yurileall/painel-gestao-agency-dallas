/* Tradução dos erros do Supabase/PostgREST para mensagens que o usuário entende. */

/** Falha de rede (sem resposta do servidor): a única situação em que repetir sozinho faz sentido. */
export function isNetworkError(e){
  if(!e || e.code) return false;
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(e.message || '');
}

/** @param {{ code?: string, message?: string }|null|undefined} e */
export function dbErrorMessage(e){
  const code = e?.code || '';
  const msg  = e?.message || 'erro desconhecido';
  if(isNetworkError(e)) return 'Sem conexão com o servidor. Verifique sua internet.';
  if(code === '42501') return 'Sem permissão para gravar na tabela. Verifique o RLS e os GRANTs no Supabase.';
  if(code === '22P02') return 'Formato de dado recusado pelo banco (' + msg + ').';
  if(code === '23514') return 'O banco recusou um valor fora das regras (' + msg + ').';
  if(code === '23502') return 'Faltou preencher um campo obrigatório (' + msg + ').';
  if(code === '23505') return 'Já existe um registro com esse identificador.';
  if(code === '42703' || code === 'PGRST204') return 'Coluna inexistente na tabela: ' + msg;
  if(code === '42P01' || code === 'PGRST205') return 'Tabela não encontrada no banco.';
  if(code === 'PGRST301' || /jwt/i.test(msg)) return 'Sua sessão expirou. Saia e entre de novo.';
  return msg;
}
