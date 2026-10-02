/* Comportamento comum dos modais: abrir/fechar, foco, Esc, erros de campo e estado "salvando". */
import { $, $$ } from './dom.js';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * @param {HTMLElement} overlay elemento .overlay que contém o .modal
 * @param {{ onClose?: () => void }} [opts]
 */
export function createModal(overlay, { onClose } = {}){
  const formError = $('.form-error', overlay);
  let returnFocusTo = null;

  const focusables = () => [...$$(FOCUSABLE, overlay)].filter(el => !el.disabled && el.offsetParent !== null);

  function open(){
    returnFocusTo = document.activeElement;
    clearErrors();
    overlay.classList.add('open');
    $('.modal-body input', overlay)?.focus();
  }

  function close(){
    if(!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    onClose?.();
    returnFocusTo?.focus?.();
  }

  function clearFieldError(el){
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    $(`#${el.id}-err`, overlay)?.remove();
  }

  function clearErrors(){
    $$('[aria-invalid]', overlay).forEach(clearFieldError);
    setFormError(null);
  }

  /** Erro geral do formulário (ex.: o banco recusou a gravação). */
  function setFormError(msg){
    formError.textContent = msg || '';
    formError.hidden = !msg;
  }

  /**
   * Mostra cada erro embaixo do seu campo e foca o primeiro.
   * @param {Object<string, string>} errors resultado de validateClient/validateLead
   * @param {Object<string, string>} fieldIds campo → id do input; erro sem input vai para o erro geral
   */
  function showErrors(errors, fieldIds){
    clearErrors();
    const general = [];
    let first = null;
    for(const [field, msg] of Object.entries(errors)){
      const el = fieldIds[field] && $('#' + fieldIds[field], overlay);
      if(!el){ general.push(msg); continue; }
      const note = document.createElement('div');
      note.className = 'field-error';
      note.id = el.id + '-err';
      note.textContent = msg;
      el.closest('.field').appendChild(note);
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', note.id);
      first ||= el;
    }
    if(general.length) setFormError(general.join(' '));
    first?.focus();
  }

  /** Trava os botões do rodapé enquanto `fn` roda, para não gravar duas vezes. */
  async function busy(btn, label, fn){
    const buttons = [...$$('.modal-foot button', overlay)];
    const original = btn.textContent;
    buttons.forEach(b => { b.disabled = true; });
    btn.textContent = label;
    try{ return await fn(); }
    finally{
      buttons.forEach(b => { b.disabled = false; });
      btn.textContent = original;
    }
  }

  // Fecha ao clicar fora. mousedown (e não click) para não fechar quando o
  // usuário arrasta uma seleção de texto de dentro do modal para fora.
  overlay.addEventListener('mousedown', e => { if(e.target === overlay) close(); });
  $('.close-btn', overlay).addEventListener('click', close);
  overlay.addEventListener('input', e => { if(e.target.hasAttribute('aria-invalid')) clearFieldError(e.target); });

  overlay.addEventListener('keydown', e => {
    if(e.key === 'Escape'){ e.stopPropagation(); close(); return; }
    if(e.key !== 'Tab') return;
    // mantém o foco dentro do modal
    const items = focusables();
    if(!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  return { open, close, showErrors, setFormError, busy };
}
