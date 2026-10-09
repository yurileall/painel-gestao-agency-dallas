# Painel Dallas

Painel de gestão da Agency Dallas. Site estático (HTML, CSS e JavaScript puro) com dados e login no Supabase.

## Como rodar

Não há etapa de build, mas o painel precisa ser servido por HTTP — os scripts
são módulos ES, e o navegador não carrega módulos de `file://`. Na pasta do
projeto:

```
npx serve
```

(ou qualquer servidor estático). Em produção, basta publicar a pasta como site
estático.

## Testes

```
npm test
```

Roda os testes de `test/` com o executor embutido do Node (18 ou mais novo),
sem instalar nada. Eles cobrem a lógica que não depende do navegador: datas,
regras de prazo, validação, conversão de/para o banco e os cálculos das telas.

## Estrutura

```
index.html              Marcação das telas
assets/img/             Logos (logo.png = sidebar e favicon, logo-login.png = tela de login)
css/
  base.css              Fontes, variáveis de tema, reset, foco e tipografia
  layout.css            Sidebar e área principal
  components.css        KPIs, painéis, barras, tabela, modal e avisos
  pipeline.css          Kanban
  auth.css              Tela de login
  responsive.css        Telas pequenas (menu no topo, tabelas em cartões)
js/
  main.js               Ponto de entrada
  config.js             URL e chave pública do Supabase
  constants.js          Combos, entregáveis, status, responsáveis e os cenários da prospecção
  store.js              Estado do app (clientes, leads, prospecção, gasto) e notify()
  lib/                  Lógica pura, sem DOM nem Supabase — é o que os testes cobrem
    dates.js            Hoje, diferença em dias, mês
    format.js           Moeda, data e escape de HTML
    mappers.js          Tipos (Client, Lead, Prospect) e conversão app <-> linha do banco
    rules.js            Prazo (SLA), follow-up e datas que dependem do status
    validate.js         Validação dos formulários
    stats.js            Cálculos de cada tela
    errors.js           Tradução dos erros do Supabase
  data/                 Leitura e gravação no Supabase, e tempo real
  ui/                   Helpers de DOM, modal base, modais de cliente, lead e prospecção, navegação
  views/                Uma função de render por tela
  app.js                Desenho da tela ativa, carga inicial e sincronização
  auth.js               Login, logout, esqueci minha senha e sessão
test/                   Testes de js/lib
```

## Como as peças se falam

- **Estado**: tudo fica em `state` (`js/store.js`). Quem altera chama
  `notify()`, e o `app.js` redesenha só a tela que está visível.
- **Gravação**: cada operação mexe em uma linha (`saveClient`, `deleteLead`,
  `setAdSpend`...) e devolve `{ ok }` ou `{ ok:false, message }`. A tela só
  muda depois que o banco confirma. Não existe "salvar a lista inteira": isso
  apagaria o que outra pessoa cadastrou enquanto a sua aba estava aberta.
- **Tempo real**: o painel assina as mudanças das quatro tabelas
  (`js/data/realtime.js`), então o que uma pessoa grava aparece para a outra
  sem recarregar. Como rede de segurança, ao voltar para a aba depois de um
  minuto os dados são buscados de novo. Se duas pessoas editarem o mesmo
  cliente ao mesmo tempo, vale a última gravação.
- **Validação**: `js/lib/validate.js` confere os formulários antes de gravar e
  mostra o erro embaixo do campo. O banco repete o mínimo (ver `schema.sql`).

## Prospecção

A tela **Prospecção** guarda os perfis do Instagram chamados no 1x1: @, WhatsApp, nicho,
cenário, canal, data da primeira mensagem, status e próximo passo. O cenário
(A, B ou C) é o que a bio do perfil mostra, e cada um tem o seu gancho de
abordagem — os textos ficam em `SCENARIOS`, em `js/constants.js`.

O @ é gravado sem o "@" e em minúsculas, e não se repete: o formulário avisa e
o banco recusa (índice único em `prospects.handle`). A tela depende da tabela
`prospects`; num banco criado antes dela, rode o `supabase/schema.sql` de novo.

## Banco (Supabase)

O SQL do banco está em `supabase/`:

- `supabase/schema.sql` — tabelas, GRANTs, políticas de RLS, regras de dados
  (status válido, valores não negativos) e publicação do tempo real. Idempotente:
  rode de novo no SQL Editor sempre que este arquivo mudar.
- `supabase/diagnostico.sql` — consultas de leitura para descobrir por que uma
  gravação não chegou ao banco (tipo das colunas, GRANTs, RLS, contagem de linhas).

Três coisas precisam estar certas para o painel gravar. Se qualquer uma faltar,
o `insert` é recusado:

1. **GRANT de tabela** para o papel `authenticated`. Sem isso o PostgREST
   devolve `42501 permission denied for table clients` — e o RLS nem é avaliado.
2. **Política de RLS** para `authenticated`. Com RLS ligado e nenhuma política,
   nada entra e nada é lido.
3. **`clients.id` e `leads.id` como `text`.** O painel gera ids no formato
   `c_mabc123xy` (veja `newId()` em `js/lib/mappers.js`). Se a coluna for `uuid`, todo
   insert falha com `22P02 invalid input syntax for type uuid`.

Quando uma gravação falha, o painel avisa na tela — dentro do modal, mantendo o
que foi digitado, ou num aviso vermelho com "Tentar de novo" — e o erro completo
do Supabase aparece no console do navegador (F12 → Console). Falha de rede é
repetida sozinha duas vezes antes de avisar.

Para o tempo real funcionar, as tabelas precisam estar na publicação
`supabase_realtime` (o fim do `schema.sql` faz isso). Sem isso o painel funciona
normalmente, mas só mostra o que outra pessoa gravou ao voltar para a aba.

### Grave sempre um registro por vez

As funções de escrita em `js/data/` (`saveClient`, `deleteClient`, `saveLead`,
`deleteLead`, `saveAdSpendMonth`, `deleteAdSpendMonth`) mexem em **uma linha**,
identificada pelo id. Isso não é detalhe de estilo.

A versão anterior mandava o array local inteiro num `upsert` e, em seguida,
apagava do banco todo id que não estivesse nesse array. Como o painel tem login
e pode estar aberto em várias abas ou por várias pessoas, isso destruía dados:
quem salvasse por último apagava o que o outro tinha acabado de cadastrar, sem
erro nenhum. Duas abas da mesma pessoa bastavam.

Se precisar de uma operação em lote, mande só as linhas afetadas — nunca derive
exclusão de "o que falta na minha cópia local".

As escritas preenchem `updated_at` com o horário do cliente. Não existe trigger
no banco fazendo isso.

## Redefinição de senha

A tela de login tem o link **Esqueci minha senha**. O fluxo usa o Supabase Auth:
o usuário pede o link, recebe um e-mail e volta para o próprio `index.html`
com um token na URL — aí o painel abre o formulário de nova senha.

Para funcionar, duas coisas precisam estar configuradas no painel do Supabase:

1. **Authentication → URL Configuration** — o endereço do painel precisa estar
   em *Site URL* e em *Redirect URLs* (ex.: `https://seu-dominio.com/index.html`).
   O código envia `window.location.origin + window.location.pathname` como
   `redirectTo`, e o Supabase recusa qualquer URL que não esteja nessa lista.
2. **Authentication → Emails** — o SMTP padrão do Supabase serve para testar,
   mas tem limite baixo de envios por hora. Para uso real, configure um SMTP
   próprio em *Project Settings → Authentication → SMTP Settings*.

Para testar esse fluxo localmente, o endereço do servidor local (ex.:
`http://localhost:3000/index.html`) também precisa estar em *Redirect URLs*.
