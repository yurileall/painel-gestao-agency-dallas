/* Constantes do negócio e estado global do app */
const COMBOS = {
  basico:     { label:'Básico que Funciona', price:197.90, deliverables:['lp','whats'] },
  presenca:   { label:'Presença Digital',    price:297.00, deliverables:['lp','whats','artes3','seo'] },
  autoridade: { label:'Kit Autoridade Local',price:397.00, deliverables:['lp','whats','artes5','seo','gbp','painel'] },
};
const DELIVERABLE_LABELS = {
  lp:'Landing page publicada',
  whats:'Integração com WhatsApp',
  artes3:'3 artes para Instagram entregues',
  artes5:'5 artes para Instagram entregues',
  seo:'SEO configurado',
  gbp:'Google Business Profile otimizado',
  painel:'Painel de atendimento (link na bio) publicado',
};
const STATUS_LABELS = { pendente:'Em espera', em_producao:'Em produção', entregue:'Pronto' };

let clients = [];
let editingId = null;
let currentView = 'dashboard';
let slaDays = 3;
let adSpend = {};
const STATUS_ORDER = ['pendente','em_producao','entregue'];
