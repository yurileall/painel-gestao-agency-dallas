# Painel Dallas

Painel de gestão da Agency Dallas. Site estático (HTML, CSS e JavaScript puro) com dados e login no Supabase.

## Como rodar

Abra o `index.html` no navegador. Não há etapa de build.

## Estrutura

```
index.html              Marcação das telas e ordem de carregamento de estilos e scripts
assets/img/             Logos (logo.png = sidebar e favicon, logo-login.png = tela de login)
css/
  base.css              Fontes, variáveis de tema, reset e tipografia
  layout.css            Sidebar e área principal
  components.css        KPIs, painéis, barras, tabela e modal
  pipeline.css          Kanban
  responsive.css        Telas pequenas
  auth.css              Tela de login
js/
  config.js             URL e chave pública do Supabase
  state.js              Constantes do negócio (combos, status) e estado global
  utils.js              Helpers de DOM, formatação, datas e HTML
  data/                 Leitura e gravação no Supabase (clients, settings, ad-spend, leads)
  ui/                   Modais de cliente e de lead, navegação
  views/                Uma função de render por tela
  app.js                renderAll, relógio e initApp
  auth.js               Login, logout, esqueci minha senha e sessão
```

## Ordem dos scripts

Os scripts são clássicos (sem módulos) e compartilham o escopo global, então a ordem das tags em `index.html` importa. O `auth.js` precisa ser o último, porque ele chama `initApp()` assim que a sessão é confirmada.

## Banco (Supabase)

O SQL do banco está em `supabase/`:

- `supabase/schema.sql` — tabelas, GRANTs e políticas de RLS. Idempotente.
- `supabase/diagnostico.sql` — consultas de leitura para descobrir por que uma
  gravação não chegou ao banco (tipo das colunas, GRANTs, RLS, contagem de linhas).

Três coisas precisam estar certas para o painel gravar. Se qualquer uma faltar,
o `insert` é recusado:

1. **GRANT de tabela** para o papel `authenticated`. Sem isso o PostgREST
   devolve `42501 permission denied for table clients` — e o RLS nem é avaliado.
2. **Política de RLS** para `authenticated`. Com RLS ligado e nenhuma política,
   nada entra e nada é lido.
3. **`clients.id` e `leads.id` como `text`.** O painel gera ids no formato
   `c_mabc123xy` (veja `uid()` em `js/utils.js`). Se a coluna for `uuid`, todo
   insert falha com `22P02 invalid input syntax for type uuid`.

Quando uma gravação falha, o painel mostra um aviso vermelho no canto da tela e
o erro completo do Supabase aparece no console do navegador (F12 → Console).

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

Abrir o `index.html` direto do disco (`file://`) não funciona para esse fluxo,
porque não existe uma URL que o Supabase possa liberar. Use um servidor local
(`python -m http.server`) ou o endereço de produção.
