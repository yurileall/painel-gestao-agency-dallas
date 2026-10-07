/* Máscaras de entrada: formatam o campo enquanto o usuário digita. */

/** @param {string} digits só números, até 11 @returns {string} "(71) 91234-5678" / "(71) 1234-5678" */
export function formatPhone(digits){
  const d = digits.slice(0, 11);
  if(!d) return '';
  if(d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if(rest.length <= 4) return `(${ddd}) ${rest}`;
  const splitAt = rest.length <= 8 ? 4 : 5; // 10 dígitos: XXXX-XXXX · 11 dígitos (com o 9): XXXXX-XXXX
  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

/** @param {HTMLInputElement} input */
export function attachPhoneMask(input){
  input.addEventListener('input', () => { input.value = formatPhone(input.value.replace(/\D/g, '')); });
}

/** @param {string} digits só números, tratados como centavos (como em caixa eletrônico) @returns {string} "1.234,56" */
export function formatCentsAsCurrency(digits){
  const cents = String(digits).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return (Number(cents || '0') / 100).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

/** @param {HTMLInputElement} input */
export function attachCurrencyMask(input){
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '');
    input.value = digits ? formatCentsAsCurrency(digits) : '';
  });
}

/** @param {string} text "1.234,56" @returns {number} NaN se não for um número válido */
export function parseCurrency(text){
  const n = Number(String(text ?? '').trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/** @param {number} value @returns {string} "1.234,56", sem o "R$" (ver fmtBRL em format.js para exibição) */
export function formatCurrencyValue(value){
  return (Number(value) || 0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
