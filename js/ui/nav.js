/* Navegação entre as telas */
// ---------- NAV ----------
$$('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    $$('.view').forEach(v=>v.classList.remove('active'));
    $('#view-'+currentView).classList.add('active');
    renderAll();
  });
});
