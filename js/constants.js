/* Constantes do negócio. Sem DOM e sem Supabase: pode ser importado nos testes. */

export const COMBOS = {
  basico:     { label:'Básico que Funciona', price:197.90, deliverables:['lp','whats'] },
  presenca:   { label:'Presença Digital',    price:297.00, deliverables:['lp','whats','artes3','seo'] },
  autoridade: { label:'Kit Autoridade Local',price:397.00, deliverables:['lp','whats','artes5','seo','gbp','painel'] },
};

export const DELIVERABLE_LABELS = {
  lp:'Landing page publicada',
  whats:'Integração com WhatsApp',
  artes3:'3 artes para Instagram entregues',
  artes5:'5 artes para Instagram entregues',
  seo:'SEO configurado',
  gbp:'Google Business Profile otimizado',
  painel:'Painel de atendimento (link na bio) publicado',
};

/* Entregáveis que guardam um link além do "feito". */
export const LINK_DELIVERABLES = ['lp','painel'];

export const STATUS_LABELS = { pendente:'Em espera', em_producao:'Em produção', entregue:'Pronto' };
export const STATUS_ORDER = ['pendente','em_producao','entregue'];

export const OWNERS = ['Breno','Yuri'];

export const DEFAULT_COMBO = 'presenca';
export const DEFAULT_SLA_DAYS = 3;
