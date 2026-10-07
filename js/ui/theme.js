/* Tema: claro, escuro ou automático (segue o sistema). A escolha fica salva no navegador. */
import { $, $$ } from './dom.js';

const KEY = 'dallas-theme'; // a mesma chave é lida pelo script do <head> em index.html
const CHOICES = ['light', 'dark', 'auto'];
const systemLight = matchMedia('(prefers-color-scheme: light)');

function readChoice(){
  try{
    const saved = localStorage.getItem(KEY);
    return CHOICES.includes(saved) ? saved : 'auto';
  }catch{
    return 'auto'; // o navegador pode bloquear o localStorage (modo privado, política da empresa)
  }
}

let choice = readChoice();

function apply(){
  const light = choice === 'light' || (choice === 'auto' && systemLight.matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  $$('.theme-opt').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === choice)));
}

$('.theme-switch').addEventListener('click', e => {
  const btn = e.target.closest('.theme-opt');
  if(!btn) return;
  choice = btn.dataset.themeChoice;
  try{ localStorage.setItem(KEY, choice); }catch{ /* sem armazenamento: vale só até recarregar */ }
  apply();
});

// no automático, acompanha a troca de tema do sistema sem precisar recarregar
systemLight.addEventListener('change', apply);
// outra aba do painel trocou o tema
window.addEventListener('storage', e => {
  if(e.key !== KEY) return;
  choice = readChoice();
  apply();
});

apply();
