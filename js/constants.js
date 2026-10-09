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

/* Prospecção 1x1 no Instagram. O cenário é o que a bio do perfil mostra; o gancho é o argumento da abordagem. */
export const SCENARIOS = {
  A: { sees:'Bio sem nenhum link',                                   hook:'Quem chega pelo conteúdo não tem para onde ir.' },
  B: { sees:'Link vai direto para o WhatsApp',                       hook:'Só converte quem já está decidido. Quem ainda está conhecendo não chama.' },
  C: { sees:'Linktree genérico, bagunçado ou com links quebrados',   hook:'Não passa a mesma confiança que o perfil passa.' },
};

export const PROSPECT_CHANNELS = { direct:'Direct', whatsapp:'WhatsApp' };

export const PROSPECT_STATUS_LABELS = {
  a_abordar:'A abordar', enviada:'Msg enviada', respondeu:'Respondeu', previa:'Prévia enviada',
  fechou:'Fechou', sem_interesse:'Sem interesse', sem_resposta:'Não respondeu',
};
export const PROSPECT_STATUS_ORDER = ['a_abordar','enviada','respondeu','previa','fechou','sem_interesse','sem_resposta'];
/* Quem respondeu, mesmo que para dizer não: entra na taxa de resposta. */
export const PROSPECT_REPLIED = ['respondeu','previa','fechou','sem_interesse'];
/* Conversa encerrada: não tem mais próximo passo. */
export const PROSPECT_CLOSED = ['fechou','sem_interesse','sem_resposta'];

export const DEFAULT_COMBO = 'presenca';
export const DEFAULT_SLA_DAYS = 3;
