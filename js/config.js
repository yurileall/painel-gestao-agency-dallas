/* Conexão com o Supabase */
/* ========================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================
   Substitua os dois valores abaixo pelos dados do SEU projeto
   Supabase (Project Settings → API):

   1) SUPABASE_URL      → "Project URL"
   2) SUPABASE_ANON_KEY  → chave "anon" / "public" (a "publishable key").

   NUNCA coloque aqui a chave "service_role" — ela é secreta e dá
   acesso total ao banco, ignorando o RLS. Aqui só entra a anon/public key,
   que é segura para uso no navegador porque o acesso real é controlado
   pelas políticas de RLS configuradas no banco.
   ======================================================== */
const SUPABASE_URL = "https://ysbjpkxztjiqzxcxymeq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LQ_DW-n6PJsx79YF0f9ddQ_ulmltELB";

/* `supabase` é o global criado pelo script UMD carregado no index.html. */
export const supabaseClient = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,   // mantém a sessão salva no navegador (localStorage)
    autoRefreshToken: true, // renova o token automaticamente
    detectSessionInUrl: true,
  }
});
