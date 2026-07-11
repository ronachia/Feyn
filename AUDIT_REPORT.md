# AUDITORIA TÉCNICA ESTRATÉGICA — FEYNLEARN
> Data: Junho 2026 | Auditor: Cascade AI | Versão analisada: 0.1.0

---

## SUMÁRIO EXECUTIVO

O FeynLearn é um produto com **conceito sólido e diferenciado**, stack moderna bem escolhida e segurança de back-end já parcialmente implementada (JWT via Clerk, OpenAI key no servidor). Porém existem **vulnerabilidades críticas de segurança** (qualquer pessoa pode ativar premium gratuitamente), **dívida técnica relevante** em componentes monolíticos, e **gaps de performance** que precisam ser resolvidos antes de escalar para mais de 1.000 usuários.

---

## 1. ANÁLISE DE ARQUITETURA

### 1.1 Estrutura de Pastas

```
src/
  components/   → APENAS 3 arquivos (VoiceRecorder, BottomNav, XPToast)
  pages/        → 12 páginas, 3 delas com >20KB
  hooks/        → 3 hooks
  store/        → 1 arquivo (God Store)
  services/     → 5 arquivos thin-wrappers (todos com <10 linhas)
  data/         → lessons.js com 107KB (!!!)
```

### 1.2 Problemas Identificados

#### 🔴 CRÍTICO — Lesson.jsx: 968 linhas, 7 fases numa única função

`Lesson.jsx` concentra em uma única função de componente:
- 7 fases do fluxo (intro, read, explain, analyzing, feedback, teaching, complete)
- 14 variáveis de estado
- 3 refs
- 5 sub-componentes inline (Phase, ScoreBar, ScoreCard, FeedbackView, TeachingPhase)
- 4 handlers assíncronos
- Toda lógica de XP, voice, teach mode e sync

**Risco:** Manutenção impossível acima de 2 colaboradores. Qualquer mudança em uma fase risca introduzir regressão em outra.

#### 🔴 CRÍTICO — God Store (`useAppStore.js`)

O store Zustand único gerencia: estado do usuário, progresso, XP, badges, streaks, gaps, sessões, preferências, assinatura, rate limit de AI, lições customizadas e gamificação. São **11 responsabilidades distintas** num único arquivo persistido em `localStorage`.

**Risco:** O `isPremium: true` pode ser setado via DevTools pelo usuário (`localStorage.setItem('feynlearn-storage', JSON.stringify({...state, isPremium: true}))`). **Qualquer usuário pode acessar recursos Premium gratuitamente.**

#### 🔴 CRÍTICO — `lessons.js`: 107KB carregado sincronamente

Arquivo estático de 107KB com todo o conteúdo das lições importado em `Home.jsx`, `LessonsList.jsx` e `Lesson.jsx`. Bloqueia o bundle inicial.

#### 🟡 IMPORTANTE — Sem Code Splitting / Lazy Loading

`App.jsx` importa todas as 12 páginas no topo do arquivo. Todas são bundladas no chunk inicial, mesmo `ThemePreview`, `Analytics`, `CreateLesson` (30KB), `AuthPage` (26KB) que o usuário raramente acessa na primeira visita.

#### 🟡 IMPORTANTE — `EdgeFunctionInit` como componente render

```js
function EdgeFunctionInit() {
  // ...3 useEffects aqui
}
// E é usado como: <EdgeFunctionInit />
```

É um anti-pattern. Componentes com efeito colateral disfarçados de componentes visuais causam confusão e podem re-renderizar de forma inesperada. Deve ser um hook `useEdgeFunctionInit()`.

#### 🟡 IMPORTANTE — Dependências mortas no `package.json`

| Pacote | Tamanho | Problema |
|--------|---------|---------|
| `openai` | ~500KB | Nunca importado no frontend. Só usado nas Edge Functions (Deno). |
| `@stripe/react-stripe-js` | ~150KB | Stripe não está ativo no frontend — Asaas/MercadoPago são usados. |
| `@stripe/stripe-js` | ~130KB | Idem. |

**Total de bundle desnecessário: ~780KB.**

#### 🟡 IMPORTANTE — Duplicação de providers de pagamento

Existem Edge Functions para **Stripe + Asaas + MercadoPago** simultaneamente, sem documentação de qual está ativo. O `asaas-webhook` usa imports legados (`https://deno.land/std@0.168.0`) enquanto todas as outras funções usam `npm:` imports modernos.

#### 🟢 MELHORIA — Services são thin-wrappers sem valor

`ai.js`, `teachMode.js`, `exercises.js` têm literalmente 3-6 linhas cada — apenas chamam `callEdgeFunction`. Poderiam ser consolidados num único `api.js`.

---

### 1.3 Classificação

| Item | Classificação | Risco |
|------|--------------|-------|
| `isPremium` bypassável via localStorage | 🔴 CRÍTICO | Perda de receita imediata |
| Lesson.jsx 968 linhas | 🔴 CRÍTICO | Manutenção impossível |
| lessons.js 107KB síncrono | 🔴 CRÍTICO | Performance mobile |
| Sem lazy loading | 🟡 IMPORTANTE | Bundle inicial pesado |
| Deps mortas (openai, stripe) | 🟡 IMPORTANTE | ~780KB desnecessários |
| God Store | 🟡 IMPORTANTE | Escalabilidade do código |
| EdgeFunctionInit anti-pattern | 🟢 MELHORIA | Menor |
| Services thin-wrappers | 🟢 MELHORIA | Menor |

---

## 2. ANÁLISE DE PERFORMANCE

### 2.1 Bundle Size Estimado (antes das correções)

| Chunk | Tamanho estimado (gzip) |
|-------|------------------------|
| react-vendor | ~45KB |
| motion (framer-motion) | ~40KB |
| openai (DESNECESSÁRIO) | ~180KB |
| supabase | ~30KB |
| charts (recharts) | ~85KB |
| stripe (DESNECESSÁRIO) | ~55KB |
| app code | ~120KB |
| **Total estimado** | **~555KB** |

Após remoção das deps mortas: **~320KB** (-42%).

### 2.2 Problemas por Página

| Página | Problema | Impacto |
|--------|---------|---------|
| Home | `useSRS` recalcula a cada render | Médio |
| Practice | AI chamada a cada abertura (sem cache) | Alto — latência + custo |
| Analytics | Recharts carregado sem lazy | Alto no bundle inicial |
| CreateLesson | 30KB, raramente acessada, sem lazy | Alto no bundle inicial |
| Lesson | 968 linhas + Framer Motion em cada fase | Médio |

### 2.3 Plano de Otimização

1. **Remover deps mortas** → -42% bundle imediato
2. **Lazy loading** em `Analytics`, `CreateLesson`, `ThemePreview`, `Pricing` → -25% carregamento inicial
3. **Virtualizar lessons.js** → importar apenas os dados necessários por rota
4. **Cache de exercises** → guardar exercícios gerados no store por 24h, evitar AI call repetida
5. **`React.memo`** em `StatCard`, `LevelBadge`, `ScoreCard` → evitar re-renders na Home

**Ganho estimado total: 55-65% de redução no bundle inicial, 30-40% de melhoria no Time to Interactive.**

---

## 3. ANÁLISE MOBILE

### 3.1 O App é Mobile First?

**Parcialmente.** O design é mobile-first visualmente (max-width: 430px, BottomNav, cards grandes), mas há problemas de implementação.

### 3.2 Safe Areas

`BottomNav` usa `env(safe-area-inset-bottom)` ✅ — bem implementado.

Porém os headers das páginas usam `pt-12` (48px fixo). No iPhone 14 Pro com notch/Dynamic Island, o `pt-12` pode não ser suficiente. Deveria usar `pt-safe-top` ou `env(safe-area-inset-top)`.

### 3.3 Problemas por Tela

| Tela | Problema | Severidade |
|------|---------|-----------|
| Lesson (explain) | Textarea com 7 linhas + word counter + 3 botões + status text = scroll intenso | Alta |
| Lesson (feedback) | 7 seções de feedback visíveis simultaneamente — sobrecarga cognitiva | Alta |
| Practice | Blank screen durante carregamento AI (~2s) | Média |
| CreateLesson | Formulário longo sem step-by-step | Média |
| Home | `pb-48` excessivo (192px de padding inferior) | Baixa |

### 3.4 Fluxo de Aprendizado — Análise de Cliques

```
Home → Lição (1 tap)
  → Intro (1 tap "Start Reading")
  → Read 60s (aguarda / 1 tap "I'm Ready")
  → Explain (escreve + 1 tap "Analyze")
  → Analyzing (aguarda ~2s)
  → Feedback (scroll longo + 1 tap "Complete")
  → Complete (1 tap "Back to Home")
```

**Total: 5 taps + 2 esperas**. Aceitável, mas a fase de Feedback pode ser simplificada com tabs ou accordion.

### 3.5 Roadmap Mobile First (Priorizado)

| Prioridade | Ação |
|-----------|------|
| 1 | Feedback dividido em tabs (Scores / Grammar / Gaps / Suggestion) |
| 2 | Skeleton loading na Practice (em vez de blank) |
| 3 | `pt-safe-top` nos headers de todas as páginas |
| 4 | Textarea auto-grow na fase Explain |
| 5 | CreateLesson → wizard step-by-step |
| 6 | Haptic feedback nos taps de conclusão (Capacitor) |

---

## 4. AUDITORIA SUPABASE

### 4.1 Estrutura das Tabelas

```sql
profiles (clerk_user_id PK, goal, level, language, is_premium, ...)
progress (clerk_user_id PK FK → profiles, xp, streak, gaps JSONB, session_history JSONB, ...)
```

### 4.2 Problemas Críticos

#### 🔴 `session_history` JSONB sem limite no servidor

O cliente limita a 100 sessões (`slice(0, 99)`), mas o servidor nunca valida isso. Um cliente malicioso pode enviar sessões ilimitadas. Com crescimento normal, em 6 meses um usuário ativo tem 180+ sessões — cada `sync-progress` escreve o blob inteiro.

**Impacto com 10k usuários:** Upserts frequentes de JSON grandes (~50KB/usuário) → degradação do Postgres.

#### 🔴 Sem RLS (Row Level Security) definido no schema

O arquivo `supabase_schema.sql` não define nenhuma política RLS. As tabelas dependem exclusivamente das Edge Functions com `service_role_key` para acesso. Se alguém obtiver o `SUPABASE_ANON_KEY` público (que é exposto no frontend), poderá consultar dados diretamente.

**NOTA:** O `SUPABASE_ANON_KEY` está no `.env` como `VITE_SUPABASE_ANON_KEY` — é exposto no bundle do frontend.

#### 🟡 `custom_lessons` no JSONB de progress

Lições customizadas com conteúdo completo (texto, keyPoints, vocabulary) guardadas no blob JSONB de progress. Um usuário com 50 lições customizadas pode ter um blob de 500KB+ sendo sincronizado a cada sessão.

#### 🟡 Risco com 10k usuários

Com 10.000 usuários:
- `progress` table: ~1GB se cada usuário tiver sessões cheias
- Cada sync chama `upsert` no blob inteiro — sem delta/merge
- Sem índice em `profiles.is_premium` (necessário para queries analíticas)

#### 🟡 Schema de migrations inconsistente

O arquivo `supabase_schema.sql` mistura `CREATE TABLE` com 10+ `ALTER TABLE` statements de migrations — impossível saber o estado real do banco de produção sem rodar tudo.

### 4.3 SQL de RLS recomendado (incluído nas correções)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
-- Edge Functions usam service_role, que bypassa RLS automaticamente. ✅
-- Isso protege acesso direto via anon key do frontend.
CREATE POLICY "block_direct_access_profiles" ON profiles FOR ALL USING (false);
CREATE POLICY "block_direct_access_progress" ON progress FOR ALL USING (false);
```

---

## 5. AUDITORIA EDGE FUNCTIONS

### 5.1 Ranking de Segurança (mais vulnerável primeiro)

#### 🔴 #1 MAIS VULNERÁVEL: `asaas-webhook`

```typescript
// PROBLEMA: Qualquer POST sem autenticação ativa premium
serve(async (req) => {
  const payload = await req.json()  // sem verificação!
  if (payload.event === 'PAYMENT_CONFIRMED') {
    // ativa premium para qualquer userId enviado
  }
})
```

**Vulnerabilidade:** Qualquer pessoa que conheça a URL da Edge Function pode enviar um POST com `{"event": "PAYMENT_CONFIRMED", "payment": {"externalReference": "user_id_qualquer"}}` e ativar premium sem pagar. A URL das Edge Functions é derivável do `VITE_SUPABASE_URL` que está exposto no frontend.

**Fix necessário:** Verificar o token secreto no header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` env var.

#### 🟡 #2: `analyze-explanation`, `teach-mode`, `generate-exercises`

Rate limiting é feito apenas no **cliente** (Zustand localStorage). Usuários podem:
- Apagar o localStorage e resetar o contador
- Usar a API diretamente com seu JWT (contornar o frontend)
- Modificar o `dailyStats` no localStorage

**Fix necessário:** Verificar e atualizar `daily_stats` no Supabase server-side na função `analyze-explanation`.

#### 🟡 #3: CORS Wildcard em todas as funções

```typescript
'Access-Control-Allow-Origin': '*'
```

Permite que qualquer origem faça requisições com o JWT do usuário. Para funções com autenticação, o CORS deveria ser restrito ao domínio do frontend.

### 5.2 Ranking de Custo (mais cara primeiro)

#### 💰 #1 MAIS CARA: `teach-mode`

Envia o contexto `explanation` completo em **todas as 4 chamadas** do modo ensino, mesmo quando apenas continuidade é necessária:

```typescript
// Round 2 e 3: explanation completa reenviada desnecessariamente
const userPrompt = round === 0
  ? `...explanation: "${explanation}"...`  // Round 0: necessário
  : isFinal
  ? `...explanation: "${explanation}"...`  // Round 3: necessário
  : `Continue the conversation...`         // Rounds 1-2: OK, não envia explanation
```

Na verdade rounds 1-2 já não enviam, mas o round final (3) reenvia a explanation completa desnecessariamente pois o modelo já tem o contexto na história.

**Custo por sessão de Teach Mode completa:** ~4.000 tokens input + ~500 output = ~$0.001

#### 💰 #2: `analyze-explanation`

Envia `originalContent` completo (pode ter 1.000+ palavras) + `keyPoints` + `userExplanation` + schema de resposta (~500 tokens) a cada análise.

**Custo por análise:** ~$0.0005

#### 💰 #3: `create-lesson` (dupla chamada)

Acionado 2x (generate-key-points + generate-content) para criar uma lição. Custo total ~$0.002 por lição criada.

### 5.3 Custo Operacional Mensal Estimado

Premissas: usuário ativo = 1.5 análises/dia, 30% usam voice, 20% usam Teach Mode

| Usuários Ativos | Analyze | Teach | Voice (Whisper) | Exercises | **Total/mês** |
|----------------|---------|-------|----------------|-----------|--------------|
| 100 | $2.25 | $0.90 | $1.80 | $0.45 | **~$5.40** |
| 1.000 | $22.50 | $9.00 | $18.00 | $4.50 | **~$54** |
| 10.000 | $225 | $90 | $180 | $45 | **~$540** |

**Receita vs Custo (10k usuários, 10% premium):**
- Receita: 1.000 × R$9.90 = R$9.900/mês (~$1.980)
- Custo AI: ~$540/mês
- Margem bruta de IA: ~72% ✅

**Whisper é o custo mais imprevisível** — se usuários gravarem áudios longos (5+ min), o custo sobe para $0.03/sessão.

### 5.4 Plano de Redução de Custos

1. **Cache de exercícios** no store por 24h → elimina 80% das chamadas a `generate-exercises`
2. **Comprimir originalContent** antes de enviar (remover espaços duplos, HTML) → -20% tokens
3. **teach-mode final round**: não reenviar explanation no round final → -300 tokens/sessão
4. **Implementar streaming** no analyze-explanation → melhor UX sem custo adicional
5. **Limite de originalContent no servidor**: cap em 3.000 chars (já há `slice(2000)` em create-lesson mas não em analyze-explanation)

---

## 6. ANÁLISE DE ESCALABILIDADE

### O que quebra primeiro por escala:

| Usuários | Gargalo | Prioridade |
|---------|---------|-----------|
| 1.000 | Rate limiting client-side bypassável | Resolver agora |
| 5.000 | `session_history` JSONB upserts pesados | Resolver em 90 dias |
| 10.000 | Supabase Free tier (500MB DB, 500k invocações Edge Functions) | Upgrade plano |
| 50.000 | Single JSONB blob para progresso inteiro | Normalizar tabela |
| 100.000 | Supabase managed Postgres limites | Considerar sharding/particionamento |

### Frontend: escala bem
- Netlify CDN distribui assets estáticos infinitamente
- SPA sem SSR — zero custo de servidor por usuário adicional

### Backend: os riscos
- Edge Functions têm cold start de ~200-500ms — aceitável
- Supabase Pro ($25/mês): 8GB DB, 5M invocações — suficiente até ~50k usuários
- Sem queue/retry em falhas de sync — progresso pode ser perdido offline

---

## 7. ANÁLISE UX E RETENÇÃO

### 7.1 Onde o Usuário Abandona

| Ponto | Risco de Abandono | Causa |
|-------|-----------------|-------|
| Fase de Feedback | Alto | 7 seções simultâneas — sobrecarga cognitiva |
| AI limit atingido (mid-lesson) | Muito Alto | Redirecionamento abrupto para /pricing durante lição |
| Practice loading | Médio | Tela em branco por ~2s gerando exercícios |
| Reading timer (60s) | Médio | Para lições longas, 60s é insuficiente |
| Onboarding | Baixo | Fluxo simples e claro |

### 7.2 Top 20 Melhorias de UX

| # | Melhoria | Impacto | Complexidade |
|---|---------|---------|-------------|
| 1 | Feedback em tabs: Scores / Grammar / Gaps / Sugestão | Alto | Baixa |
| 2 | Skeleton loading na Practice | Alto | Baixa |
| 3 | Avisar limite AI ANTES de iniciar a lição, não no meio | Alto | Baixa |
| 4 | Timer adaptativo: 60s para beginner, 90s para advanced | Médio | Baixa |
| 5 | Salvar explicação em draft no localStorage | Médio | Baixa |
| 6 | Animação de XP com streak multiplicador visível | Médio | Baixa |
| 7 | Swipe gestures para navegar entre fases (mobile) | Alto | Média |
| 8 | Notificação push de streak em risco (Capacitor) | Médio | Média |
| 9 | Compartilhar resultado da lição (screenshot social) | Médio | Média |
| 10 | Modo offline: marcar lição para sincronizar depois | Alto | Alta |
| 11 | Barra de progresso da lição com checkpoint por fase | Médio | Baixa |
| 12 | Tooltip educativo na primeira vez em cada fase | Médio | Baixa |
| 13 | Revisão rápida de gaps: flip card style | Médio | Média |
| 14 | "Daily Goal" configurável (1/2/3 lições por dia) | Médio | Média |
| 15 | Celebração animada ao completar todas lições de um nível | Alto | Baixa |
| 16 | Detalhes do badge ao clicar (critérios + progresso) | Baixo | Baixa |
| 17 | Lição recomendada baseada nos gaps do usuário | Alto | Alta |
| 18 | Pause/Resume no timer de leitura | Médio | Baixa |
| 19 | Histórico de explicações anteriores na mesma lição | Baixo | Média |
| 20 | Configuração de idioma de interface (PT/EN) mais visível | Baixo | Baixa |

---

## 8. PREPARAÇÃO PARA SAAS ESCALÁVEL

### Estado Atual vs Necessário

| Feature SaaS | Estado Atual | Adaptações Necessárias |
|-------------|-------------|----------------------|
| Plano Free | ✅ Implementado | Ajustar limite para 3/dia (vs 2 no código) |
| Plano Premium | ✅ Funcional | Adicionar verificação server-side de expiração |
| Plano Corporativo | ❌ Ausente | Nova tabela `organizations`, multi-user |
| White Label | ❌ Ausente | Tema por tenant, subdomínio, logo customizável |
| Marketplace | ❌ Ausente | `lessons` como tabela pública compartilhada |
| Multi Tenant | ❌ Ausente | Adicionar `organization_id` em todas as tabelas |
| API pública | ❌ Ausente | Necessário para integrações B2B |

### Caminho para Multi Tenant (12-24 meses)

1. Criar tabela `organizations` com plano, branding, configurações
2. Adicionar `organization_id` em `profiles` e `progress`
3. Criar `organization_lessons` — lições privadas por empresa
4. Criar painel admin por organização
5. White label: variáveis CSS por tenant, subdomínio via Netlify

---

## 9. RELATÓRIO FINAL — MATRIZ DE PRIORIDADES

### 🔴 CRÍTICOS — Resolver imediatamente

| # | Problema | Impacto | Risco | Complexidade | Recomendação |
|---|---------|---------|-------|-------------|-------------|
| C1 | `asaas-webhook` sem autenticação | Perda de receita (premium gratuito) | ALTO | Baixa | Verificar `asaas-access-token` header no webhook |
| C2 | `isPremium` bypassável via localStorage | Perda de receita | ALTO | Baixa | Sempre validar premium via Supabase no `loadFromSupabase` |
| C3 | Rate limit de IA só no cliente | Custos infinitos por usuário | ALTO | Média | Mover contador para Supabase, verificar no servidor |
| C4 | Sem RLS nas tabelas Supabase | Vazamento de dados com anon key | ALTO | Baixa | Adicionar políticas RLS no schema |
| C5 | `lessons.js` 107KB síncrono | Performance mobile crítica | MÉDIO | Média | Dividir por categoria ou lazy import |

### 🟡 IMPORTANTES — Próximos 90 dias

| # | Problema | Impacto | Risco | Complexidade | Recomendação |
|---|---------|---------|-------|-------------|-------------|
| I1 | Sem lazy loading nas rotas | Bundle inicial pesado | MÉDIO | Baixa | `React.lazy` + `Suspense` em todas as páginas |
| I2 | Deps mortas (openai, stripe) ~780KB | Performance | MÉDIO | Baixa | Remover do `package.json` |
| I3 | Lesson.jsx 968 linhas monolítico | Manutenção impossível | MÉDIO | Alta | Extrair cada fase em componente próprio |
| I4 | `session_history` JSONB cresce sem limite server-side | Escala Supabase | MÉDIO | Baixa | Validar e truncar no `sync-progress` |
| I5 | `teach-mode` reenvia contexto desnecessário | Custo IA | BAIXO | Baixa | Remover explanation do round final |
| I6 | Limite AI inconsistente (2 no código, 3 nos docs) | Experiência do usuário | BAIXO | Mínima | Padronizar para 3/dia |
| I7 | Practice sem cache de exercícios | Custo + UX | MÉDIO | Baixa | Cache no store por 24h |
| I8 | Feedback da lição: 7 seções simultâneas | Retenção/UX | ALTO | Baixa | Dividir em tabs |
| I9 | Aviso de limite AI no meio da lição | Abandono | ALTO | Baixa | Verificar limite antes de iniciar fase explain |
| I10 | `asaas-webhook` com imports legados | Manutenção | BAIXO | Baixa | Migrar para `Deno.serve` + `npm:` imports |

### 🟢 EVOLUÇÃO — Próximos 12 meses

| # | Item | Impacto | Complexidade |
|---|-----|---------|-------------|
| E1 | Normalizar `session_history` em tabela própria | Escala 50k+ usuários | Alta |
| E2 | Multi-tenant / plano corporativo | Novo mercado | Muito Alta |
| E3 | Marketplace de lições (lições públicas compartilhadas) | Engajamento | Alta |
| E4 | Streaming de resposta AI (SSE) | UX percebida | Média |
| E5 | Modo offline com sync posterior (Service Worker) | Retenção mobile | Alta |
| E6 | Notificações push via Capacitor | Retenção (streak) | Média |
| E7 | White label / subdomínio por empresa | Mercado B2B | Alta |
| E8 | Expiração automática de premium server-side | Receita | Média |
| E9 | Analytics de negócio (conversão free→premium, churn) | Crescimento | Média |
| E10 | Testes automatizados (Vitest + Playwright) | Qualidade | Alta |

---

## 10. NOTAS FINAIS — SCORES

| Dimensão | Nota | Justificativa |
|---------|------|--------------|
| **Arquitetura** | 5.5/10 | Stack correta, mas componentes monolíticos, God Store, sem separação de camadas |
| **Segurança** | 4.0/10 | JWT implementado, mas webhook sem auth, isPremium bypassável, sem RLS |
| **Performance** | 5.0/10 | Code splitting parcial, mas 107KB síncrono, 780KB de deps mortas, sem lazy routing |
| **Mobile** | 7.0/10 | Design mobile-first sólido, safe-area parcial, BottomNav bem implementado |
| **Escalabilidade** | 5.5/10 | Supabase bem usado, mas JSONB crescente, rate limit client-side, sem RLS |
| **Produto** | 8.5/10 | Conceito único, gamificação bem implementada, SRS, Teach Mode são diferenciais reais |
| **UX** | 7.0/10 | Fluxo claro, feedbacks visuais bons, mas fase de Feedback sobrecarregada |
| **IA** | 7.5/10 | Prompts bem construídos, JSON mode usado corretamente, custo controlável |

### 🏆 NOTA FINAL: **6.2 / 10**

> Produto com potencial real de mercado e diferenciação genuína. As vulnerabilidades de segurança são os bloqueadores mais urgentes antes de qualquer escala. Com as correções críticas aplicadas, o produto sobe para ~7.5/10 e está pronto para crescimento seguro até 10k usuários.

---

*Todas as correções críticas foram implementadas no código nesta auditoria. Ver commits/diff para detalhes.*
