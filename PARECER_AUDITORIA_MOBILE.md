# Parecer Técnico — FeynLearn: Auditoria de Código, Migração de Pagamento e Prontidão Mobile

Data: 11/07/2026
Escopo: `/Users/ronaldochiarelli/CascadeProjects/Feyn/`

---

## Resumo executivo

Três descobertas mudam o que você pediu:

1. **A migração de Asaas → Mercado Pago já está feita no código.** Não sobrou nenhum arquivo de código-fonte, env var ou schema com "asaas" — só restam menções em documentos internos desatualizados (`CHANGELOG.md`, `AUDIT_REPORT.md`, `FEYNLEARN_MASTER_DOC.md`).
2. **O app já foi parcialmente portado para Android via Capacitor** — existe `android/`, `capacitor.config.json` e dependências Capacitor no `package.json`. A conversão mobile não começa do zero.
3. **Existem dois bugs de segurança/custo reais e verificados** que devem ser corrigidos antes de qualquer coisa, porque afetam diretamente dinheiro (custo de API) e pagamento (checkout quebrado). Detalhados abaixo com evidência de código.

Nada disso foi assumido a partir da documentação — cada afirmação abaixo foi conferida lendo o arquivo apontado.

---

## 1. Migração Mercado Pago: nada a fazer no código, falta higienizar docs e provedor

Busquei "asaas" em todo o projeto (fora `node_modules`/`.git`). Resultado: zero ocorrências em código. As Edge Functions já são `create-mercado-pago-checkout`, `create-mercado-pago-subscription` e `mercado-pago-webhook`; o schema SQL já usa colunas `mercado_pago_*`; `.env.example` só lista `MERCADO_PAGO_ACCESS_TOKEN`/`MERCADO_PAGO_WEBHOOK_SECRET`; e `src/pages/Pricing.jsx` já mostra "Pagamento seguro via Mercado Pago" na UI.

**O que falta, então, não é codificação — é limpeza e verificação:**
- Apagar/atualizar as referências a Asaas em `CHANGELOG.md`, `AUDIT_REPORT.md` e `FEYNLEARN_MASTER_DOC.md` (confundem qualquer pessoa nova que ler o master doc).
- Confirmar, fora do código, que a conta Asaas está encerrada e que não existe mais nenhuma env var `ASAAS_*` configurada como secret no painel do Supabase em produção — isso eu não consigo verificar por aqui.

## 2. Bug confirmado: checkout do Mercado Pago provavelmente quebra no navegador

Em `supabase/functions/create-mercado-pago-checkout/index.ts:10`:
```ts
if (req.method === 'OPTIONS') return handleCors()
```
`handleCors` (`supabase/functions/_shared/cors.ts:7`) é definido como `handleCors(req: Request)` e faz `req.method` internamente. Aqui é chamado **sem argumento** — `req` fica `undefined` dentro da função, e `undefined.method` lança `TypeError`. Todo navegador faz um preflight `OPTIONS` antes do `POST` real para essa function, então essa function tende a falhar exatamente na etapa de preflight, quebrando o botão de checkout.

Confirmei que a function irmã, `create-mercado-pago-subscription/index.ts:13`, faz certo (`handleCors(req)`), assim como `sync-progress`, `get-profile`, `analyze-explanation` etc. É um erro isolado nessa function. **Correção de uma linha**, mas prioritária — sem ela o checkout único (não-assinatura) do Mercado Pago não funciona.

## 3. Bug confirmado: o limite de "3 análises IA grátis/dia" é bypassável, e vale dinheiro

Isso é mais sério que o item 2 porque é uma falha de design, não uma linha errada.

- `analyze-explanation/index.ts` é a **única** das 6 funções que custam OpenAI/Whisper (`analyze-explanation`, `transcribe-audio`, `analyze-fluency`, `teach-mode`, `generate-exercises`, `create-lesson`) que checa `is_premium` e um contador antes de chamar a IA. As outras cinco só validam o JWT do Clerk e chamam a OpenAI direto — **qualquer usuário autenticado, free, pode chamar `teach-mode` (chat multi-turno) ou `transcribe-audio` (Whisper, cobrado por minuto) quantas vezes quiser**, direto contra a URL da function, ignorando o gate "Premium" que hoje só existe na interface (`src/pages/Lesson.jsx:324,479`).
- Pior: até a única checagem que existe é furável. `analyze-explanation` lê o contador em `progress.daily_stats` (tabela `progress`). Mas `sync-progress/index.ts:50` grava esse mesmo campo direto do corpo da requisição do client (`daily_stats: progress.dailyStats`), **sem validar nada**. Isso é literalmente o mesmo estado do Zustand que fica em `localStorage` no navegador — editável via DevTools. Um usuário chama `sync-progress` com `dailyStats: { date: hoje, aiCalls: -999999 }` e a partir daí `analyze-explanation` libera chamadas ilimitadas também.

**Recomendação, nessa ordem, antes de tocar em mobile ou em qualquer coisa nova:**
1. Mover o contador de uso de IA para uma coluna/tabela que só as próprias Edge Functions de IA escrevem — nunca aceitar esse valor vindo do client via `sync-progress`.
2. Replicar a checagem de `is_premium`/quota (que hoje só existe em `analyze-explanation`) nas outras 5 funções pagas, especialmente `teach-mode` e `transcribe-audio`, que são as mais caras (chat multi-turno e transcrição de áudio).

Isso importa duplamente para o pivô de pagamento: se a intenção é migrar/validar o modelo de cobrança via Mercado Pago, faz sentido garantir que o "free" realmente pare em 3 chamadas antes de ligar o gatilho de conversão para Premium.

## 4. Estratégia de APIs: bem desenhada em princípio, mal aplicada na prática

O padrão está correto: **nenhuma chamada de IA sai do client.** Tudo passa por Edge Functions do Supabase, autenticadas via JWT do Clerk (verificado contra o JWKS do Clerk com a lib `jose`, em todas as 16 functions, sem exceção). Não há chave da OpenAI nem segredo nenhum exposto em `src/` — busquei por `sk-`, `OPENAI`, `process.env` e as únicas envs no client são as públicas por design (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`). Essa parte da arquitetura está certa e não precisa mudar para mobile — Edge Functions continuam funcionando do mesmo jeito chamadas de um WebView Capacitor.

O problema não é a estratégia, é a aplicação inconsistente dela: a Edge Function de menor custo (`analyze-explanation`, é só texto) tem rate limit; as de maior custo (voz, chat multi-turno) não têm. Isso é o item 3 acima, e é a prioridade real antes de somar mais uma superfície (mobile) a essa mesma falha.

Um ponto secundário: nenhuma Edge Function valida o `payload` recebido com schema (é tudo checagem manual de campos). Não é bloqueante, mas qualquer endpoint que hoje aceita JSON livre do client (como `sync-progress`) fica mais arriscado sem isso.

## 5. Prontidão para mobile: mais avançada do que parecia, com 3 gaps concretos

Já existe `android/` completo (Gradle, manifest, `MainActivity`), `capacitor.config.json` (`appId: com.feynlearn.app`) e uma camada de abstração dedicada (`src/services/platform.js`) que já isola diferenças web/nativo e já tem comentários apontando o caminho para React Native, se um dia for essa a escolha em vez de Capacitor.

Gaps que encontrei e que bloqueiam features hoje existentes ao rodar no Android:

1. **Gravação de voz (Whisper) não vai funcionar** — `VoiceRecorder.jsx` usa `getUserMedia`/`MediaRecorder`, mas o `AndroidManifest.xml` só declara permissão de `INTERNET`, sem `RECORD_AUDIO`, e não há plugin de microfone nem tratamento de permissão em runtime no `MainActivity.java`. Essa é uma feature paga (Premium) — vale corrigir antes de publicar, ou o recurso mais vendido do plano pago simplesmente não funciona no app Android.
2. **Ditado por voz (Web Speech API)** não existe no WebView do Android (só no Chrome completo). O código já trata isso sem quebrar (mostra "Voice recognition is not supported"), mas a feature some silenciosamente — o próprio comentário em `platform.js` já sugere trocar por `@capacitor-community/speech-recognition`.
3. **Notificações de streak** usam a API `Notification` de browser, que não existe em WebView — precisa `@capacitor/local-notifications` (não instalado ainda).

Secundário: `localStorage` guarda todo o estado crítico (XP, progresso, flag de premium) via `zustand/persist`; funciona em Capacitor, mas `@capacitor/preferences` é mais robusto a limpezas de app pelo SO — não bloqueante, mas vale migrar quando mexer no mobile.

## 6. Outros achados de qualidade (não bloqueantes, mas relevantes)

- **Zero testes automatizados** no projeto inteiro (nem componente React, nem Edge Function).
- **Tratamento de erro inconsistente** em `src/pages/Lesson.jsx`: alguns catches (`handleSubmit`) mostram erro ao usuário, outros (`startTeaching`, `sendTeachingAnswer`) falham silenciosamente — o usuário não sabe se o Teach Mode travou por bug ou por rede.
- **Mistura de padrões Deno**: `create-mercado-pago-checkout`/`create-mercado-pago-subscription` ainda usam `import { serve } from 'https://deno.land/std...'` (import legado via URL), enquanto todas as outras 14 functions já usam `Deno.serve` nativo.
- **`git status` mostra tudo isso (Mercado Pago, Android, admin panel, Sentry, i18n) como uncommitted/untracked** — só 6 commits no histórico, o último de auth. Vale commitar o estado atual antes de começar a mexer em mobile, para ter um ponto de rollback confiável.

---

## Ordem recomendada de trabalho

1. Corrigir `handleCors()` → `handleCors(req)` em `create-mercado-pago-checkout/index.ts` (1 linha, checkout pode estar quebrado agora).
2. Fechar o buraco do rate limit de IA (mover contador para fora de `sync-progress`, replicar checagem premium nas 5 functions que não têm).
3. Commitar o estado atual do projeto (checkpoint antes de mexer em mobile).
4. Corrigir os 3 gaps de mobile (permissão de áudio + manifest, notificações via Capacitor, decisão sobre ditado por voz).
5. Aí sim, seguir com o trabalho de conversão/publicação mobile propriamente dito.

Higienizar os docs internos (`CHANGELOG.md`, `AUDIT_REPORT.md`, `FEYNLEARN_MASTER_DOC.md`) removendo menções a Asaas pode ser feito em paralelo, é baixo risco.
