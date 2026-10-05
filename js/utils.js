/* Helpers de DOM, formatação, datas e HTML */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtBRL = v => 'R$ ' + (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
const fmtDate = iso => { if(!iso) return '—'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; };
const monthKey = iso => iso ? iso.slice(0,7) : '';
const monthLabel = key => { if(!key) return ''; const [y,m]=key.split('-'); const names=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${names[parseInt(m,10)-1]}/${y}`; };

function daysBetween(iso1, iso2){
  if(!iso1) return 0;
  const d1 = new Date(iso1+'T00:00:00');
  const d2 = iso2 ? new Date(iso2+'T00:00:00') : new Date();
  return Math.round((d2-d1)/(1000*60*60*24));
}

function uid(){ return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

/* Rótulo do combo pronto para ir ao HTML. O valor vem do banco como texto
   livre, então o fallback precisa ser escapado. */
function comboLabel(combo){
  if(!combo) return 'Não decidiu';
  return COMBOS[combo]?.label || escapeHtml(combo);
}

function statusBadge(status){
  return `<span class="badge ${status}"><span class="badge-dot"></span>${STATUS_LABELS[status]}</span>`;
}

function emptyState(msg){
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>
    <p>${msg}</p>
    <button class="new-client-btn" onclick="document.getElementById('btnNewClientTop').click()">+ Novo cliente</button>
  </div>`;
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- AVISOS NA TELA ----------
   Erro de gravação no banco não pode ficar só no console: o usuário precisa
   saber que o que ele acabou de fazer NÃO foi salvo. */
function toast(msg, type){
  let wrap = $('#toastWrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.classList.add('leaving'); setTimeout(()=>el.remove(), 250); }, type==='error' ? 7000 : 3500);
}

/* Mensagem curta a partir do erro do Supabase, com dica para as causas comuns. */
function dbErrorMessage(e){
  const code = e?.code || '';
  const msg  = e?.message || 'erro desconhecido';
  if(code === '42501') return 'Sem permissão para gravar na tabela. Verifique o RLS e os GRANTs no Supabase.';
  if(code === '22P02') return 'Formato de dado recusado pelo banco (' + msg + ').';
  if(code === '42703' || code === 'PGRST204') return 'Coluna inexistente na tabela: ' + msg;
  if(code === '42P01') return 'Tabela não encontrada no banco.';
  return msg;
}
