/* Navegação entre as telas */
import { state, notify } from '../store.js';
import { $, $$ } from './dom.js';

$('.nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if(!btn) return;
  state.currentView = btn.dataset.view;
  $$('.nav-item').forEach(b => {
    const active = b === btn;
    b.classList.toggle('active', active);
    if(active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + state.currentView));
  btn.scrollIntoView({ block:'nearest', inline:'nearest' }); // no celular o menu rola na horizontal
  notify();
});
