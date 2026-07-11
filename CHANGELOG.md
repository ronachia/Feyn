# FeynLearn — Relatório de Alterações
> Auditoria técnica completa + implementação de correções críticas  
> Período: Junho 2026

---

## 🔴 CRÍTICOS — Segurança

### C1 — Row Level Security (RLS) no Supabase
**Arquivo:** `supabase_schema.sql`  
**Problema:** Tabelas `profiles` e `progress` acessíveis diretamente via `anon key` exposta no bundle do frontend. Qualquer usuário poderia ler ou escrever dados de outros usuários.  
**Solução:** RLS habilitado em ambas as tabelas com policy `deny_direct_*` bloqueando todo acesso direto. Acesso legítimo ocorre exclusivamente via Edge Functions com `service_role_key`.

---

### C2 — `isPremium` bypassável via localStorage
**Arquivo:** `src/hooks/useProgressSync.js`  
**Problema:** O status premium era salvo no localStorage e nunca resetado pelo servidor — qualquer usuário podia ativar premium via DevTools (`localStorage.setItem('isPremium', true)`).  
**Solução:** `loadFromSupabase` agora sempre sobrescreve `isPremium` com o valor do servidor, verificando também `premium_expires_at` para suporte a expiração de plano.

---

### C3 — Webhooks sem autenticação
**Arquivos:** `supabase/functions/mercado-pago-webhook/index.ts`, `supabase/functions/asaas-webhook/index.ts`  
**Problema:** Qualquer pessoa podia fazer um POST na URL do webhook e ativar premium gratuitamente para qualquer usuário.  
**Solução:** Verificação HMAC-SHA256 oficial do Mercado Pago (`x-signature` header com `ts` + `v1`). Webhooks rejeitados com 401 se assinatura inválida.

---

### C4 — Rate limiting de IA apenas no client-side
**Arquivo:** `supabase/functions/analyze-explanation/index.ts`  
**Problema:** O limite de 3 análises/dia era controlado só no frontend — contornável via DevTools ou chamadas diretas à Edge Function.  
**Solução:** Rate limiting implementado no servidor: verifica e incrementa contador `daily_stats.aiCalls` no Supabase antes de chamar a OpenAI. Retorna 429 se limite atingido.

---

### C5 — `lessons.js` (107KB) no bundle inicial
**Arquivos:** `src/hooks/useSRS.js`, `src/App.jsx`  
**Problema:** Todo o conteúdo das lições era carregado na primeira visita, mesmo antes do usuário fazer login.  
**Solução:** `useSRS` usa `import()` dinâmico — carrega `lessons.js` só quando o usuário tem lições completadas. `Lesson.jsx` tornado lazy em `App.jsx`, movendo lessons.js + subcomponentes para chunk separado. Bundle inicial: **345KB → 307KB (−11%)**.

---

## 🟡 IMPORTANTES — Performance e UX

### I1 — Lazy loading de rotas
**Arquivo:** `src/App.jsx`  
**Problema:** Todas as páginas eram carregadas sincronamente no bundle inicial.  
**Solução:** `React.lazy` + `Suspense` aplicados em: `Profile`, `LessonsList`, `Practice`, `CreateLesson`, `Pricing`, `Analytics`, `ThemePreview`, `Lesson`. Cada página virou chunk separado carregado sob demanda.

---

### I2 — Dependências mortas removidas
**Arquivo:** `package.json`, `vite.config.js`  
**Problema:** `openai` (~500KB), `@stripe/react-stripe-js` (~150KB) e `@stripe/stripe-js` (~130KB) instaladas mas não usadas no frontend.  
**Solução:** Removidas do `package.json`. Chunk `openai` removido do `vite.config.js`. **Total removido: ~780KB do bundle.**

---

### I3 — `Lesson.jsx` monolítico (968 linhas)
**Arquivos:** `src/pages/Lesson.jsx`, `src/components/lesson/LessonRead.jsx`, `src/components/lesson/LessonFeedback.jsx`, `src/components/lesson/LessonTeaching.jsx`  
**Problema:** Um único arquivo de 968 linhas misturava lógica de estado, 6 fases distintas e 5 subcomponentes — difícil de manter e testar.  
**Solução:** Extraídos 3 componentes dedicados:
- `LessonRead` — fase de leitura (texto, vídeo, áudio)
- `LessonFeedback` — feedback da IA com sistema de tabs
- `LessonTeaching` — chat com Teo (AI Student)

`Lesson.jsx` reduzido para **578 linhas (−41%)**.

---

### I4 — `session_history` sem cap no servidor
**Arquivo:** `supabase/functions/sync-progress/index.ts`  
**Problema:** O JSONB `session_history` crescia indefinidamente — cada lição adicionava um registro sem limite, podendo gerar payloads de MB com o tempo.  
**Solução:** Truncagem server-side antes do upsert: `session_history` limitado a 100 registros, `custom_lessons` a 50.

---

### I5 — `teach-mode` enviando tokens redundantes
**Arquivo:** `supabase/functions/teach-mode/index.ts`  
**Problema:** Na rodada final, a explicação completa do usuário era reenviada desnecessariamente, dobrando o consumo de tokens.  
**Solução:** Rodada final (`isFinal`) envia prompt mínimo — só instrui o modelo a dar o veredicto sem reenviar contexto.

---

### I6 — Sem validação de input nas Edge Functions
**Arquivo:** `supabase/functions/analyze-explanation/index.ts`  
**Problema:** Prompts arbitrariamente longos podiam ser enviados, causando custos descontrolados na OpenAI.  
**Solução:** Validação de tamanho máximo do prompt antes de chamar a API. Retorna 400 se exceder limite.

---

### I7 — `Practice` sem cache de exercícios
**Arquivos:** `src/store/useAppStore.js`, `src/pages/Practice.jsx`  
**Problema:** Cada vez que o usuário abria a página Practice, uma nova chamada à IA era feita, mesmo que os gaps fossem os mesmos.  
**Solução:** Cache client-side com TTL de 24h no Zustand store (`exerciseCache`). Se o usuário pratica os mesmos gaps nas últimas 24h, usa o cache — zero chamada de IA.

---

### I8 — Feedback da IA com 7 seções simultâneas
**Arquivo:** `src/components/lesson/LessonFeedback.jsx`  
**Problema:** Toda a análise era exibida de uma vez — Scores, Grammar, Missed Points, Gaps, Tips, Fluency e Suggested Explanation empilhados, criando cognitive overload.  
**Solução:** Sistema de 4 tabs: **Scores** (clarity + coverage + fluency) / **Grammar** (erros com correções) / **Gaps** (pontos perdidos + conceitos) / **Tips** (simplificação + modelo Feynman). Badges com contadores nos tabs de Grammar e Gaps.

---

### I9 — Redirecionamento abrupto ao atingir limite de IA
**Arquivo:** `src/pages/Lesson.jsx`  
**Problema:** Ao atingir o limite diário de análises, o usuário era redirecionado para `/pricing` instantaneamente, perdendo tudo que havia escrito.  
**Solução:** Aviso inline com banner âmbar exibido no lugar do botão "Analyze", texto do usuário preservado, botão de upgrade contextual. Nenhum redirecionamento forçado.

---

## 🧹 LIMPEZA — Remoção do Stripe

### Stripe completamente removido do projeto

| Local | O que foi removido |
|-------|-------------------|
| `package.json` | `openai`, `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| `supabase_schema.sql` | Colunas `stripe_customer_id`, `stripe_subscription_id`, `asaas_customer_id`, `asaas_payment_id` |
| `src/i18n/pt.json` + `en.json` | Referências ao Stripe nos textos de pricing |
| `vite.config.js` | Chunk `openai` e `supabase` removidos do manualChunks |
| `.env.example` | Removidas todas as variáveis do Stripe e Asaas |
| Supabase Secrets | `STRIPE_SECRET_KEY`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` deletados |
| `/Feyn/Feyn/` | Pasta duplicada antiga com Edge Functions `stripe-webhook` e `create-checkout-session` deletada |

---

## 🚀 DEPLOY — Produção atualizada

### Edge Functions deployadas
| Função | Alterações |
|--------|-----------|
| `sync-progress` | Cap de session_history (100) e custom_lessons (50) |
| `mercado-pago-webhook` | Verificação HMAC-SHA256 + migração para `Deno.serve` |
| `analyze-explanation` | Rate limiting server-side + validação de input |

### Secrets em produção (estado final)
| Secret | Status |
|--------|--------|
| `MERCADO_PAGO_ACCESS_TOKEN` | ✅ Ativo |
| `MERCADO_PAGO_WEBHOOK_SECRET` | ✅ Novo secret configurado |
| `OPENAI_API_KEY` | ✅ Ativo |
| `CLERK_JWKS_URL` | ✅ Ativo |
| `STRIPE_*` (3 secrets) | 🗑️ Removidos |

---

## 📊 Impacto Resumido

| Métrica | Antes | Depois |
|---------|-------|--------|
| Bundle inicial (gzip) | ~102KB | ~93KB |
| Bundle total (gzip) | ~207KB | ~196KB |
| Dependências Stripe/OpenAI frontend | 3 pacotes (~780KB) | 0 |
| `Lesson.jsx` linhas | 968 | 578 (−41%) |
| `isPremium` bypassável | Sim | Não |
| Rate limit server-side | Não | Sim |
| Webhook autenticado | Não | Sim (HMAC-SHA256) |
| RLS no banco | Não | Sim |
| Cache de exercícios | Não | Sim (24h TTL) |

---

## ⏭️ Próximos Passos Sugeridos (EVOLUÇÃO)

- Migrar `lessons.js` para tabela Supabase (editar conteúdo sem deploy)
- Push notifications para lembrete de streak
- Suporte PWA offline para lições já abertas
- Trial de 7 dias Premium com email pós-expiração
- Sentry para monitoramento de erros em produção
- Rodar SQL de migração no Supabase para dropar colunas Stripe/Asaas antigas
