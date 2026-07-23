# FeynLearn — Resumo técnico para continuar no Claude Code

Documento de handoff. Cobre a auditoria de código, as correções aplicadas, a conversão
para mobile (Android/iOS) e o bloqueio atual que impede login nativo funcionar no app
empacotado. Repositório: `github.com/ronachia/Feyn` (branch `main`).

## Stack

- Frontend: React 18 + Vite + TailwindCSS + Zustand (persist) + Framer Motion
- Auth: Clerk (`@clerk/clerk-react` ^5.61.6) — **instância de desenvolvimento**
- Backend: Supabase (Postgres + Edge Functions em Deno), RLS ativado
- IA: OpenAI GPT-4o-mini + Whisper, sempre via Edge Functions (nunca client-side)
- Pagamento: Mercado Pago (migrado de Asaas/Stripe antes desta sessão)
- Mobile: Capacitor 8 — Android e iOS (`@capacitor/*` ^8.x), iOS via Swift Package
  Manager (sem CocoaPods, sem `.xcworkspace`, só `App.xcodeproj`)

## O que já foi auditado e corrigido (commits, mais recente primeiro)

```
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

## BLOQUEIO ATUAL — login não funciona dentro do app empacotado (iOS)

**Sintoma**: login com e-mail/senha mostra "Please wait..." e trava para sempre
(sem erro). Login social com Google redireciona pro Clerk e trava em tela
branca.

**Diagnóstico confirmado** (via Safari Web Inspector conectado ao device físico):
as requisições de rede pro Clerk (`sign_ins` em `premium-wallaby-58.clerk.accounts.dev`)
completam rápido e sem erro (~700-900ms). O problema não é rede nem CORS — a
API do Clerk responde normalmente.

**Causa raiz mais provável**: `@clerk/clerk-react` é o SDK de **web**, feito pra
rodar num browser normal, não dentro de um WebView nativo (Capacitor). Instâncias
de **desenvolvimento** do Clerk dependem de sincronizar sessão entre o domínio do
app e o Frontend API do Clerk via um mecanismo de cookie entre domínios (o
`__clerk_db_jwt` que já apareceu como problema no teste do Android também). Isso
depende de redirect/cookie cross-domain que não funciona de forma confiável
dentro da origem isolada do WKWebView do Capacitor (`capacitor://localhost`).
Resultado: a API confirma a sessão no servidor, mas o SDK no device nunca
recebe/persiste o token — `setActive()` fica pendurado e `isSignedIn` nunca
muda.

Isso é consistente com **todos** os sintomas vistos: Google login trava em tela
branca, "Please wait" trava no login por senha, e nada disso acontece na versão
web (browser normal) do mesmo código.

**Não foi resolvido ainda.** Não é um bug de lógica no nosso código — é uma
limitação arquitetural de usar o SDK web do Clerk (modo dev) dentro de um
WebView nativo.

### Caminhos possíveis (decisão pendente do usuário)

1. **Migrar Clerk para instância de produção com domínio próprio**
   (ex: `clerk.feynlearn.app`). Instâncias de produção usam esquema de cookie
   diferente (não dependem do dev-browser JWT sync), o que tende a resolver
   isso. Exige ter um domínio configurado — na auditoria original o usuário
   ainda não tinha domínio publicado. Mudança de código é pequena (troca de
   chave pública + config de domínio no dashboard do Clerk), o trabalho real
   está fora do código (DNS, dashboard do Clerk).

2. **Reescrever a camada de auth pra algo nativo** (ex: `@clerk/clerk-expo`,
   ou sair de Capacitor+React puro e ir para React Native, ou implementar
   OAuth nativo via custom URL scheme). Envolve mais esforço, mas resolve o
   problema na raiz (SDKs feitos especificamente pra apps nativos lidam com
   sessão de forma diferente, sem depender de cookie cross-domain).

3. **Testar o app via navegador comum por enquanto** (funciona normalmente,
   já que o problema é específico do WebView empacotado) e deixar a decisão
   de mobile pra depois.

O usuário está avaliando se vale a pena **recomeçar a parte mobile do zero**
numa stack nativa em vez de seguir com Capacitor — essa é a pergunta em aberto
que motivou pedir esse resumo pro Claude Code.

## Ambiente / chaves (não versionadas, estão em `.env` e `.env.local` no projeto)

- `VITE_CLERK_PUBLISHABLE_KEY` — chave de **teste** (`pk_test_...`,
  instância `premium-wallaby-58.clerk.accounts.dev`)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — projeto
  `lhsjidzooiexbyodnnzw.supabase.co` (já teve o projeto pausado uma vez por
  inatividade — plano free do Supabase pausa sozinho; se voltar a dar erro
  521/Cloudflare "Web server is down", é isso, basta reativar no dashboard)
- `.env.local` também guarda `SUPABASE_SERVICE_ROLE_KEY` (sem prefixo `VITE_`,
  então não vaza pro bundle do cliente — correto)

## Estado do git

- Branch `main` sincronizada com `origin/main` até o commit `9f8a2de`.
- Push feito manualmente com token pessoal (o usuário disse que ia revogar o
  token depois de usar — se for pedir push de novo, provavelmente vai precisar
  gerar um novo).
- Há arquivos deletados não commitados na raiz (`FEYNLEARN_MASTER_DOC.md`,
  `FeynLearn_Calendario_Conteudo.xlsx`, `FeynLearn_Landing_Page.html`,
  `FeynLearn_Pitch_Deck.pptx`, `FeynLearn_Plano_Marketing.docx`,
  `FeynLearn_Teo_Identidade_Visual.docx`, `Teo_mascote.svg`) e uma pasta nova
  não rastreada `marketing/` — parecem ter sido movidos de lugar numa sessão
  separada de marketing; não commitei isso, fica pra confirmar antes.

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
