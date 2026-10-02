/* Autenticação (Supabase Auth): login, logout, redefinição de senha e sessão */
import { supabaseClient } from './config.js';
import { startApp, stopApp } from './app.js';

/* A tela de login tem três painéis: entrar, pedir o link de redefinição e
   criar a nova senha. O terceiro só abre quando o usuário chega pelo e-mail. */
const authPanels = {
  login:  document.getElementById('loginPanel'),
  forgot: document.getElementById('forgotPanel'),
  reset:  document.getElementById('resetPanel'),
};

const loginError = document.getElementById('loginError');
const loginOk    = document.getElementById('loginOk');

function setLoginError(msg){
  if(!msg){ loginError.classList.remove('show'); loginError.textContent=''; return; }
  loginError.textContent = msg;
  loginError.classList.add('show');
}
function setLoginOk(msg){
  if(!msg){ loginOk.classList.remove('show'); loginOk.textContent=''; return; }
  loginOk.textContent = msg;
  loginOk.classList.add('show');
}

function showAuthPanel(name, manterMensagens){
  if(!manterMensagens){ setLoginError(null); setLoginOk(null); }
  Object.entries(authPanels).forEach(([key, el])=>{ el.hidden = (key !== name); });
}

function showLogin(){
  document.body.classList.remove('authed');
  stopApp();
  if(!recoveryMode) showAuthPanel('login', true);
}
function showApp(session){
  document.body.classList.add('authed');
  document.getElementById('sidebarUserEmail').textContent = session?.user?.email || '';
  /* Fora da pilha do onAuthStateChange: o cliente do Supabase segura um lock
     durante o callback, e consultar o banco ali dentro pode travar. startApp
     ignora chamadas repetidas (o evento dispara de novo a cada renovação de token). */
  setTimeout(startApp, 0);
}

/* ---------- LINK DE REDEFINIÇÃO NA URL ----------
   Ao clicar no link do e-mail, o Supabase devolve o usuário para cá com os
   tokens no hash da URL (#access_token=...&type=recovery). O cliente consome
   esse hash sozinho (detectSessionInUrl) e cria uma sessão temporária — por
   isso o modo "recovery" é marcado ANTES, para o usuário não cair direto no
   painel sem ter trocado a senha. */
let recoveryMode = false;

(function detectarRecoveryNaUrl(){
  const hash  = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);

  const err = hash.get('error_description') || hash.get('error')
           || query.get('error_description') || query.get('error');
  if(err){
    const expirado = /expired|invalid/i.test(err);
    setLoginError(expirado
      ? 'Este link de redefinição expirou ou já foi usado. Peça um novo link.'
      : decodeURIComponent(err.replace(/\+/g, ' ')));
    history.replaceState(null, '', window.location.pathname);
    return;
  }

  if(hash.get('type') === 'recovery' || query.get('type') === 'recovery'){
    recoveryMode = true;
    showAuthPanel('reset');
  }
})();

/* ---------- ENTRAR ---------- */
const loginForm = document.getElementById('loginForm');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');

loginForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  setLoginError(null); setLoginOk(null);
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = 'Entrando...';
  try{
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){
      setLoginError(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message);
    }
    // sucesso: onAuthStateChange cuida de mostrar o app
  }catch(err){
    setLoginError('Não foi possível conectar. Verifique sua internet e tente novamente.');
  }finally{
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = 'Entrar';
  }
});

/* ---------- ESQUECI MINHA SENHA ---------- */
const forgotForm = document.getElementById('forgotForm');
const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');

document.getElementById('btnForgot').addEventListener('click', ()=>{
  showAuthPanel('forgot');
  // reaproveita o e-mail já digitado no login
  const forgotEmail = document.getElementById('forgotEmail');
  forgotEmail.value = document.getElementById('loginEmail').value.trim();
  forgotEmail.focus();
});

document.getElementById('btnBackToLogin').addEventListener('click', ()=>{
  showAuthPanel('login');
});

forgotForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  setLoginError(null); setLoginOk(null);
  const email = document.getElementById('forgotEmail').value.trim();
  forgotSubmitBtn.disabled = true;
  forgotSubmitBtn.textContent = 'Enviando...';
  try{
    /* Volta para esta mesma página. A URL precisa estar liberada no Supabase
       em Authentication → URL Configuration → Redirect URLs. */
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
    if(error){
      setLoginError(/rate limit|too many/i.test(error.message)
        ? 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
        : error.message);
    }else{
      showAuthPanel('login');
      setLoginOk('Se este e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Verifique também a caixa de spam.');
    }
  }catch(err){
    setLoginError('Não foi possível conectar. Verifique sua internet e tente novamente.');
  }finally{
    forgotSubmitBtn.disabled = false;
    forgotSubmitBtn.textContent = 'Enviar link';
  }
});

/* ---------- CRIAR A NOVA SENHA ---------- */
const resetForm = document.getElementById('resetForm');
const resetSubmitBtn = document.getElementById('resetSubmitBtn');

resetForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  setLoginError(null); setLoginOk(null);
  const senha  = document.getElementById('resetPassword').value;
  const senha2 = document.getElementById('resetPassword2').value;

  if(senha.length < 8){ setLoginError('A senha precisa ter no mínimo 8 caracteres.'); return; }
  if(senha !== senha2){ setLoginError('As duas senhas não são iguais.'); return; }

  resetSubmitBtn.disabled = true;
  resetSubmitBtn.textContent = 'Salvando...';
  try{
    const { error } = await supabaseClient.auth.updateUser({ password: senha });
    if(error){
      setLoginError(/same.*password|different from the old/i.test(error.message)
        ? 'A nova senha precisa ser diferente da anterior.'
        : error.message);
      return;
    }
    // senha trocada: a sessão da recuperação já vale como login normal
    recoveryMode = false;
    resetForm.reset();
    history.replaceState(null, '', window.location.pathname);
    const { data } = await supabaseClient.auth.getSession();
    if(data?.session){
      showApp(data.session);
    }else{
      showAuthPanel('login');
      setLoginOk('Senha alterada. Entre com a nova senha.');
    }
  }catch(err){
    setLoginError('Não foi possível conectar. Verifique sua internet e tente novamente.');
  }finally{
    resetSubmitBtn.disabled = false;
    resetSubmitBtn.textContent = 'Salvar nova senha';
  }
});

document.getElementById('btnCancelReset').addEventListener('click', async ()=>{
  recoveryMode = false;
  resetForm.reset();
  history.replaceState(null, '', window.location.pathname);
  await supabaseClient.auth.signOut();
  showAuthPanel('login');
});

/* ---------- LOGOUT ---------- */
document.getElementById('btnLogout').addEventListener('click', async ()=>{
  await supabaseClient.auth.signOut();
  // onAuthStateChange cuida de mostrar a tela de login
});

/* ---------- SESSÃO ---------- */
supabaseClient.auth.onAuthStateChange((event, session)=>{
  if(event === 'PASSWORD_RECOVERY'){
    recoveryMode = true;
    document.body.classList.remove('authed');
    showAuthPanel('reset');
    return;
  }
  /* Durante a recuperação existe uma sessão válida, mas o usuário ainda
     precisa definir a nova senha antes de entrar no painel. */
  if(recoveryMode) return;

  if(session){
    showApp(session);
  }else{
    showLogin();
  }
});

// checagem inicial da sessão (cobre o caso de refresh de página / navegador reaberto)
(async function checkInitialSession(){
  const { data } = await supabaseClient.auth.getSession();
  if(recoveryMode) return;
  if(data?.session){
    showApp(data.session);
  }else{
    showLogin();
  }
})();
