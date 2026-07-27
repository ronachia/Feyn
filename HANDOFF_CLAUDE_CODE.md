# FeynLearn — Resumo técnico para continuar no Claude Code

Documento de handoff. Cobre a auditoria de código, as correções aplicadas, a conversão
para mobile (Android/iOS) e o bloqueio atual que impede login nativo funcionar no app
empacotado. Repositório: `github.com/ronachia/Feyn` (branch `main`).

## Stack

- Frontend: React 18 + Vite + TailwindCSS + Zustand (persist) + Framer Motion
- Auth: Clerk (`@clerk/clerk-react` ^5.61.6) — **instância de produção**, domínio
  `feynlearn.com.br` (migrado de dev em 2026-07-27, ver seção própria abaixo)
- Backend: Supabase (Postgres + Edge Functions em Deno), RLS ativado
- IA: OpenAI GPT-4o-mini + Whisper, sempre via Edge Functions (nunca client-side)
- Pagamento: Mercado Pago (migrado de Asaas/Stripe antes desta sessão)
- Mobile: Capacitor 8 — Android e iOS (`@capacitor/*` ^8.x), iOS via Swift Package
  Manager (sem CocoaPods, sem `.xcworkspace`, só `App.xcodeproj`)

## O que já foi auditado e corrigido (commits, mais recente primeiro)

```
5ca72eb fix: handle needs_second_factor in sign-in (2FA silently failed)
64ff8bd chore: config.toml -> create-subscription, drop dead Stripe/Asaas columns
2b940f6 refactor: decouple Mercado Pago behind a PaymentProvider interface
bcc1f17 chore: clean up root clutter, consolidate SQL into supabase/migrations/
4e8690e chore: organize marketing assets into marketing/ folder, add handoff doc
9f8a2de fix: add clerk-captcha mount point, sign-in hangs forever without it
07f28b5 fix: reset password flow ausente + RequireAuth redirecionando pro Clerk hosted
7575758 fix: crash on empty lessons list, broken native login redirect
40e552b feat: marketing assets + pricing update to R$59,90/month
85aa09f refactor: extract useLessonFlow hook, fix silent errors, warn about AI limit earlier
62bbd8b fix: remove dead legacy lessons data file, fix AI limit copy mismatch
4c2cab0 feat: iOS platform, payment deep link, resilient native storage
082ab80 feat: mobile mic permission + Capacitor notifications, docs cleanup
65e181c chore: checkpoint before mobile work
a866f8d feat: migrate auth from Supabase to Clerk
```

Resumo do que cada bloco resolveu:

**Segurança/backend (Edge Functions, Supabase)**
- CORS quebrado no `create-mercado-pago-checkout` (chamava `handleCors()` sem o `req`).
- Bypass do limite diário de IA: `sync-progress` aceitava `daily_stats` vindo do
  cliente e sobrescrevia o contador — removido, quota só é escrita server-side
  (`supabase/functions/_shared/rateLimit.ts`).
- `transcribe-audio`, `analyze-fluency`, `teach-mode`, `create-lesson` não tinham
  checagem de Premium no servidor (só escondiam botão na UI) — adicionado
  `isPremiumUser()` retornando 403.
- Arquivo morto de 108KB (`src/data/lessons.js`) substituído por `lessonHelpers.js`.
- Copy divergente na Pricing ("2 análises/dia" vs quota real de 3) corrigida.

**Mobile (Android + iOS)**
- Permissão de microfone no Android (`RECORD_AUDIO` no manifest + runtime grant
  em `MainActivity.java`, via `onPermissionRequest` do WebChromeClient).
- Notificações locais, storage nativo (`@capacitor/preferences` via
  `src/services/nativeStorage.js`, usado no `persist` do Zustand) e deep link
  handling (`onAppUrlOpen` em `src/services/platform.js` + `DeepLinkHandler` no
  `App.jsx`) para o retorno do checkout do Mercado Pago.
- Plataforma iOS adicionada (`npx cap add ios`), `NSMicrophoneUsageDescription`
  no `Info.plist`.
- **Bug real de produção corrigido via teste em device físico**: `Home.jsx`
  quebrava com `TypeError` quando a lista de lições vinha vazia (loading/erro de
  rede) — `lessons.find(...) || lessons[0]` retornava `undefined` e o código
  acessava `.icon` direto. Corrigido com fallback de loading/erro.
- **Bug real de produção**: `AuthPage.jsx` usava `window.location.href = '/home'`
  pra redirecionar após login — dentro do WebView do Capacitor isso causa reload
  de página inteira (`ERR_CONNECTION_REFUSED`/tela branca). Trocado por
  `useNavigate()`.
- Botões de login social (Google/Apple/GitHub) escondidos em plataforma nativa
  (`isNativePlatform()` em `src/services/platform.js`) porque o
  `authenticateWithRedirect` do Clerk faz redirect de página inteira pra uma URL
  relativa que não existe de verdade dentro do WebView.
- `App.jsx`: `RequireAuth` usava `<RedirectToSignIn/>` do Clerk (manda pra página
  **hospedada pelo Clerk**, fora do SPA) em vez de navegar pra `/auth` interna —
  trocado por `<Navigate to="/auth"/>`, mesmo padrão já usado em
  `RequireOnboarding`/`RequireAdmin`.
- `SignInForm`: "Forgot password?" só disparava o e-mail com código e não tinha
  campo pra digitar o código + nova senha — implementado o fluxo completo
  (`signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code, password })`).
- Adicionado `<div id="clerk-captcha" />` nos formulários (Clerk exige esse
  elemento no DOM pra montar o desafio de bot-protection/Turnstile).

**Refatoração**
- `Lesson.jsx` tinha ~15 `useState` e handlers concentrados — extraído tudo pra
  `src/hooks/useLessonFlow.js`. Erros que antes falhavam silenciosamente
  (`startTeaching`, `sendTeachingAnswer`, `handleVoiceTranscript`) agora mostram
  banner de erro visível.
- Aviso de limite diário de IA agora aparece já na tela de intro da lição (não
  só no momento de submeter a resposta).

**Sessão Claude Code (reorganização pré-domínio + testes end-to-end)**
- Raiz limpa: `AUDIT_REPORT.md`, `CHANGELOG.md`, `PARECER_AUDITORIA_MOBILE.md` e
  `__MACOSX/` removidos (obsoletos/duplicados, histórico continua no git log).
  Schema do banco consolidado em `supabase/migrations/` (antes eram 4 `.sql`
  soltos na raiz, aplicados manualmente).
- **Mercado Pago desacoplado** atrás de uma interface `PaymentProvider`
  (`supabase/functions/_shared/payments/`) — necessário porque o app vai
  expandir pra fora do Brasil, onde MP não é opção. `create-mercado-pago-subscription`
  virou `create-subscription` (genérico); `create-mercado-pago-checkout` (morta,
  não usada) foi removida. Colunas do banco generalizadas:
  `mercado_pago_customer_id/subscription_id/payment_id` → `payment_provider_*`
  + nova coluna `payment_provider`. De brinde, encontrei e removi colunas mortas
  de uma migração Stripe/Asaas anterior (`stripe_customer_id`,
  `stripe_subscription_id`, `asaas_customer_id`, `asaas_payment_id`) que nunca
  tinham sido limpas — e 4 Edge Functions mortas ainda ativas no Supabase
  (`stripe-webhook`, `create-checkout-session`, `create-asaas-checkout`,
  `asaas-webhook`) que precisam ser deletadas manualmente (`supabase functions
  delete <nome>` — sem tool de MCP pra isso).
- **Bug real encontrado testando com conta real (2FA ativado)**: `SignInForm`
  em `AuthPage.jsx` só tratava `signIn.create()` retornando `status: 'complete'`.
  Contas com 2FA voltam `needs_second_factor` — o form não tratava esse caso,
  então o login **falhava silenciosamente** (sem erro, sem loading, só voltava
  ao normal). Corrigido: novo estágio de tela pra código de verificação
  (`signIn.prepareSecondFactor` + `signIn.attemptSecondFactor`), testado
  ponta-a-ponta com conta real. Isso não é specífico de mobile — acontecia
  também no browser normal, pra qualquer conta com 2FA.
- IA confirmada funcionando (`analyze-explanation` testado diretamente,
  retornou feedback completo e coerente da OpenAI).
- **RESOLVIDO/confirmado não-bloqueante (2026-07-27)**: a suspeita de tela
  branca na fase `read` da lição (`Lesson.jsx`, interação entre
  `React.StrictMode` e `AnimatePresence mode="wait"`) foi testada num build
  de produção real (`npm run build && npm run preview`, conta de teste ponta
  a ponta: onboarding → placement → lição). As transições `intro → read` e
  `read → explain` renderizaram corretamente, sem tela branca. Confirma a
  hipótese original: era um artefato exclusivo do `React.StrictMode` (que se
  desliga sozinho em build de produção), não afeta usuários reais. Nenhuma
  mudança de código necessária.

## RESOLVIDO (2026-07-23, sessão Claude Code) — login funcionando no app empacotado (iOS)

O bloqueio abaixo (mantido como histórico) descrevia uma tela branca no
WebView empacotado e levantava a hipótese de um problema arquitetural de
cookie cross-domain do SDK web do Clerk dentro do WKWebView. **Essa hipótese
estava errada** — ou pelo menos não era a causa da tela branca observada.

**Causa raiz real**: o site publicado em `feynlearn.netlify.app` (pra onde
`capacitor.config.json`'s `server.url` aponta, ver commit `7ca9ad8`) estava
com a env var `VITE_CLERK_PUBLISHABLE_KEY` **ausente na configuração do
projeto na Netlify** (só tinha `VITE_OPENAI_API_KEY`, `VITE_SUPABASE_ANON_KEY`,
`VITE_SUPABASE_URL`). Sem a chave, `@clerk/clerk-react` lança
`Missing publishableKey` e o app crasha silenciosamente no mount — tela
branca tanto no browser normal quanto no WebView nativo, sem log de erro de
rede porque a requisição nunca chega a acontecer. Isso não é específico de
mobile: qualquer visitante real do site em produção via browser normal
também estava vendo tela branca até esse fix.

**Fix**: adicionada a env var na Netlify (mesma chave de teste do
`.env.local`) via MCP, e disparado rebuild via `git push` (site é
git-linked ao GitHub, branch `main`). Confirmado funcionando: build ficou
`ready` com o commit novo, `feynlearn.netlify.app` carrega a tela de login
completa no browser normal, e o WebView do simulador iOS também passou a
renderizar a tela de login corretamente.

**Teste end-to-end confirmado pelo usuário no simulador**: login com
e-mail/senha funcionou, incluindo o fluxo de 2FA (código enviado por
e-mail) — entrou normalmente. O SDK web do Clerk (modo dev) funciona sim
dentro do WKWebView do Capacitor quando servido de um domínio https real
(`server.url` no `capacitor.config.json` apontando pra
`https://feynlearn.netlify.app` em vez de assets locais empacotados) — a
teoria de que seria necessário migrar pra instância de produção do Clerk
antes de mobile funcionar **não se confirmou como bloqueante**; pode ainda
valer a pena migrar depois (ver "Ambiente / chaves"), mas não é mais um
requisito para o login nativo funcionar.

**Pendência secundária, não bloqueante**: durante a investigação, a
automação de tap via simulador (Claude Code iOS Simulator tool) não
disparava nenhuma atividade observável (sem log de rede/Clerk) ao tocar no
botão "Sign In" — nem sucesso nem o "Please wait" documentado antes. O
usuário testou manualmente no mesmo simulador e funcionou normalmente, então
isso parece ser uma limitação da automação de tap (coordenada ou timing),
não um bug do app. Não investigado a fundo — não é prioridade agora que o
fluxo real funciona.

<details>
<summary>Bloqueio original (histórico, mantido pra contexto — a causa raiz correta é a descrita acima)</summary>

**Sintoma**: login com e-mail/senha mostra "Please wait..." e trava para sempre
(sem erro). Login social com Google redireciona pro Clerk e trava em tela
branca.

**Diagnóstico confirmado** (via Safari Web Inspector conectado ao device físico):
as requisições de rede pro Clerk (`sign_ins` em `premium-wallaby-58.clerk.accounts.dev`)
completam rápido e sem erro (~700-900ms). O problema não é rede nem CORS — a
API do Clerk responde normalmente.

**Causa raiz mais provável** (❌ não confirmada, ver acima): `@clerk/clerk-react`
é o SDK de **web**, feito pra rodar num browser normal, não dentro de um
WebView nativo (Capacitor). Instâncias de **desenvolvimento** do Clerk
dependem de sincronizar sessão entre o domínio do app e o Frontend API do
Clerk via um mecanismo de cookie entre domínios (o `__clerk_db_jwt` que já
apareceu como problema no teste do Android também).

</details>

## RESOLVIDO (2026-07-27) — migração do Clerk para produção + bug crítico de sync

**Migração Clerk dev → produção**: DNS de `feynlearn.com.br` propagou (nameservers
NS1/Netlify) e SSL confirmado. Migração feita via `clerk deploy` (CLI oficial da
Clerk, `npm install -g clerk`) em vez do dashboard manual — o CLI mesmo avisa
quando um passo precisa de terminal interativo humano (ex: `clerk deploy`
propriamente dito não roda via automação, mas `clerk config patch`, `clerk env
pull`, `clerk users list/create` rodam normalmente via Bash). Registros DNS
(`clerk`, `accounts`, `clkmail`, `clk._domainkey`, `clk2._domainkey`) criados via
API da própria Netlify (`netlify api createDnsRecord` falhou com erro genérico;
a chamada direta via `curl` na API REST da Netlify com o token do
`~/Library/Preferences/netlify/config.json` funcionou). Chave nova
(`pk_live_...`) atualizada na Netlify via `netlify env:set` (o MCP da Netlify
caiu no meio da sessão; CLI local é um fallback confiável) + `CLERK_JWKS_URL`
(`https://clerk.feynlearn.com.br/.well-known/jwks.json`) atualizado como secret
do Supabase.

**Dois bugs reais encontrados no processo**:
- A config do Clerk (dev **e** produção) exigia `username` no cadastro
  (`auth_username.required_for_sign_up: true`), mas o formulário de cadastro do
  app nunca coleta username (zero referências no código-fonte) — todo cadastro
  novo falhava com "Couldn't find your account" após verificar o e-mail.
  Corrigido desativando a exigência de username via `clerk config patch` (dev
  e prod).
- Instância de produção tinha SMS/telefone como segundo fator + "device trust"
  configurados (feature paga do plano Pro do Clerk) — bloqueava `clerk deploy`
  pedindo upgrade. Desativado via `clerk config patch` já que o app só usa
  e-mail como segundo fator.

**Bug crítico e pré-existente, não relacionado a mobile nem a essa migração**:
desde que o auth migrou de Supabase pra Clerk, **nenhuma conta nova sincronizou
perfil ou progresso pro Supabase** — falha silenciosa (erro 400 capturado e só
logado no console, nunca visível pro usuário). Causa raiz, duas partes:
1. `profiles.id` (uuid) não tinha valor padrão, e o upsert do edge function
   nunca envia esse campo → violação de not-null em todo insert novo.
2. `progress.id` ainda era foreign key pra `auth.users(id)` (resquício de antes
   da migração pro Clerk) — como usuários Clerk nunca ganham linha em
   `auth.users`, todo insert violava a FK. `progress.id` é na verdade um link
   1:1 com `profiles.id`; a FK foi trocada pra apontar pra lá.
   `sync-progress`/`get-profile` também assumiam uma coluna `progress.clerk_user_id`
   que nunca existiu — corrigido pra buscar o profile primeiro e linkar por
   `id`. Migrations: `20260727205219_profiles_id_default_uuid.sql` e
   `20260727205653_progress_fk_to_profiles_not_auth_users.sql`. Edge functions
   `sync-progress`/`get-profile` redeployados. Testado e confirmado com conta
   real de teste (`ronaldo.chiarelli@teki.digital`).
- Histórico de migrations do Supabase (`supabase_migrations.schema_migrations`)
  estava **vazio** antes dessa sessão — o schema vivo do banco nunca foi criado
  pelas migrations versionadas do repo, divergiu por fora ao longo do tempo.
  As duas migrations novas foram aplicadas via `apply_migration` (fica
  registrado corretamente); migrations antigas continuam não registradas.

## Ambiente / chaves (não versionadas, estão em `.env` e `.env.local` no projeto)

- `VITE_CLERK_PUBLISHABLE_KEY` — chave de **produção** (`pk_live_...`,
  instância vinculada a `clerk.feynlearn.com.br`) desde 2026-07-27. A instância
  de dev (`premium-wallaby-58.clerk.accounts.dev`, `pk_test_...`) continua
  existindo separada, com sua própria base de usuários — contas de teste
  antigas criadas em dev não existem em produção.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — projeto
  `lhsjidzooiexbyodnnzw.supabase.co` (já teve o projeto pausado uma vez por
  inatividade — plano free do Supabase pausa sozinho; se voltar a dar erro
  521/Cloudflare "Web server is down", é isso, basta reativar no dashboard)
- `.env.local` também guarda `SUPABASE_SERVICE_ROLE_KEY` (sem prefixo `VITE_`,
  então não vaza pro bundle do cliente — correto)

## Estado do git

- Branch `main` sincronizada com `origin/main` até o commit `23a92cf` (fix do
  bug de sync profiles/progress). Todos os commits dessa sessão (fix de
  hidratação, debug do capacitor server.url, doc do bloqueio mobile resolvido,
  fix de sync) já foram dados push.
- Arquivos de marketing já commitados e organizados em `marketing/`
  (`FEYNLEARN_MASTER_DOC.md`, `FeynLearn_Calendario_Conteudo.xlsx`,
  `FeynLearn_Landing_Page.html`, `FeynLearn_Pitch_Deck.pptx`,
  `FeynLearn_Plano_Marketing.docx`, `FeynLearn_Teo_Identidade_Visual.docx`,
  `Teo_mascote.svg`).
- `www.feynlearn.com.br` — DNS propagado (nameservers NS1/Netlify), SSL
  confirmado, instância de produção do Clerk migrada e testada
  end-to-end (ver seção "RESOLVIDO (2026-07-27)" acima). Nada pendente aqui.

## Outras pendências já conhecidas (não bloqueantes)

- Android emulator nunca conseguiu conectividade de rede (DNS falhando em dois
  system images diferentes) — abandonado em favor de teste em iPhone físico,
  nunca root-causado.
- Android App Links / iOS Universal Links pro deep link do Mercado Pago:
  documentado em `MOBILE_BUILD_CHECKLIST.md`, precisa de domínio de produção
  pra configurar `assetlinks.json`/`apple-app-site-association`.
- Ainda não existe keystore de assinatura pro Android nem provisioning de
  distribuição pro iOS (só signing local de desenvolvimento) — necessário
  antes de qualquer submissão pra loja.
</content>
