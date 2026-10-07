/* Constantes do negócio. Sem DOM e sem Supabase: pode ser importado nos testes. */

/* kind:'combo' = escolha única entre si; kind:'addon' = itens avulsos que podem ser combinados entre si, mas não com um combo. */
export const COMBOS = {
  basico:      { label:'Básico que Funciona', price:197.90, kind:'combo' },
  presenca:    { label:'Presença Digital',    price:297.00, kind:'combo' },
  autoridade:  { label:'Kit Autoridade Local',price:397.00, kind:'combo' },
  landing_page:{ label:'Landing Page',        price:197.90, kind:'addon' },
  link_bio:    { label:'Link na Bio',         price:197.90, kind:'addon' },
};

export const STATUS_LABELS = { pendente:'Em espera', em_producao:'Em produção', entregue:'Pronto' };
export const STATUS_ORDER = ['pendente','em_producao','entregue'];

export const OWNERS = ['Breno','Yuri'];

export const DEFAULT_COMBO = 'presenca';
export const DEFAULT_SLA_DAYS = 3;
