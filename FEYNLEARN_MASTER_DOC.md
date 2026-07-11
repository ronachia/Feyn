# FeynLearn — Master Document
> Versão: 1.1 | Última atualização: Julho 2026 (gateway de pagamento atualizado para Mercado Pago; ver `PARECER_AUDITORIA_MOBILE.md` para o parecer técnico completo)

---

## 1. Conceito

**FeynLearn** é um aplicativo de aprendizado de inglês baseado na **Técnica Feynman** (método de ensinar para aprender). O app combina inteligência artificial (OpenAI GPT-4o-mini) com gamificação (XP, streaks, badges, levels) para criar uma experiência de aprendizado ativo e efetiva.

### O Problema que Resolve
- Métodos tradicionais: passivos (vídeos, flashcards) = baixa retenção
- FeynLearn: ativo (ler → explicar → receber feedback AI) = alta retenção (90%+ conforme pesquisas sobre técnica Feynman)

---

## 2. A Técnica Feynman no App

O fluxo de cada lição segue 4 passos:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. INTRODUÇÃO                                                  │
│     → Contextualiza o tema, mostra objetivos                     │
├─────────────────────────────────────────────────────────────────┤
│  2. LEITURA (60 segundos)                                       │
│     → Conteúdo da lição com timer                                │
│     → Botão "Peek" (espiar) — afeta score                        │
├─────────────────────────────────────────────────────────────────┤
│  3. EXPLICAÇÃO                                                   │
│     → Usuário explica com suas palavras (texto ou voz)          │
│     → Input via teclado ou Voice Recorder (Whisper AI)          │
├─────────────────────────────────────────────────────────────────┤
│  4. FEEDBACK AI                                                 │
│     → GPT-4o-mini analisa: clareza, cobertura, gaps              │
│     → Score 0-100, explicação didática, sugestões              │
├─────────────────────────────────────────────────────────────────┤
│  5. TEACH MODE (Premium)                                        │
│     → Teo (AI estudante virtual) faz perguntas                   │
│     → Simula ensinar para outra pessoa                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Gamificação

### Sistema de XP
| Ação | XP |
|------|-----|
| Completar lição | 50-100 base |
| Clareza alta (>80) | +20 bonus |
| Cobertura alta (>80) | +20 bonus |
| No Peek (não espiou) | +15 bonus |
| Streak > 3 dias | +10% multiplier |
| Teach Mode completado | +mastery × 10 |

### Níveis (Levels)
| Nível | XP Necessário | Cor |
|-------|--------------|-----|
| Beginner | 0-499 | Cinza |
| Explorer | 500-1,999 | Azul |
| Scholar | 2,000-4,999 | Verde |
| Expert | 5,000-9,999 | Roxo |
| Master | 10,000-19,999 | Laranja |
| Grandmaster | 20,000+ | Dourado |

### Badges (Conquistas)
- 🔥 **Streak Warrior** — 7 dias consecutivos
- 🎯 **No Peek Champion** — 10 lições sem espiar
- 🧠 **Clarity Master** — 5 explicações com >90 clareza
- 📚 **Completionist** — Todas as lições da biblioteca
- 💎 **Gap Fixer** — Corrigir 10 gaps diferentes

---

## 4. Arquitetura Técnica

### Stack
| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + Framer Motion |
| Estado | Zustand (persist localStorage) |
| Auth | Clerk (@clerk/clerk-react) |
| Banco | Supabase (Postgres) — profiles, progress |
| AI | OpenAI GPT-4o-mini (via Edge Functions) |
| Voz | Whisper API + Web Speech API |
| Pagamentos | Mercado Pago (PIX/Boleto/Cartão) |
| Deploy | Netlify |

### Segurança (Implementado Jun/2025)
- ✅ OpenAI API key: servidor (Edge Function secret) — nunca cliente
- ✅ Todas chamadas AI via Supabase Edge Functions autenticadas (Clerk JWT)
- ✅ Premium: ativação via webhook Mercado Pago, servidor → servidor, com verificação HMAC-SHA256
- ✅ Progresso: sincronizado com Supabase (backup + multi-device)

### Edge Functions (Supabase)
| Função | Propósito |
|--------|-----------|
| `analyze-explanation` | Análise Feynman da explicação |
| `transcribe-audio` | Whisper: voz → texto |
| `analyze-fluency` | Fluency scoring (WPM, filler words) |
| `teach-mode` | Teo (AI estudante) |
| `generate-exercises` | Exercícios personalizados baseados em gaps |
| `create-lesson` | Gera lições custom via AI |
| `create-mercado-pago-checkout` | Checkout único (PIX/Boleto/Cartão) |
| `create-mercado-pago-subscription` | Assinatura recorrente Premium |
| `mercado-pago-webhook` | Confirma pagamento (HMAC verificado) → ativa premium |
| `sync-progress` | Salva progresso no Supabase (não aceita `daily_stats` do client — ver `_shared/rateLimit.ts`) |
| `get-profile` | Carrega progresso do Supabase |

---

## 5. Telas do App

### Auth & Onboarding
| Rota | Descrição |
|------|-----------|
| `/auth` | Login/Registro via Clerk |
| `/` | OnboardingGuard → Onboarding ou redirect |
| `/placement` | Teste de nivelamento inicial (10 perguntas) |

### Core Experience
| Rota | Descrição | Componentes Principais |
|------|-----------|------------------------|
| `/home` | Dashboard — XP, streak, próxima lição, gaps | XPBar, Streak, NextLessonCard, GapsList, BadgesGrid |
| `/lessons` | Lista de todas as lições | LessonCard, LevelFilter, Search |
| `/lesson/:id` | Flow completo da lição | Timer, ContentViewer, VoiceRecorder, FeedbackPanel, TeachMode |
| `/practice` | Exercícios baseados em gaps | ExerciseCard, WordOrder, FillBlank, MultipleChoice |
| `/create` | Criar lições custom (Premium) | ContentTypeSelector, TemplateGallery, AIGenerator |

### User & Premium
| Rota | Descrição |
|------|-----------|
| `/pricing` | Planos Free vs Premium, checkout Mercado Pago |
| `/profile` | Stats, badges, preferências, idioma, dark mode |
| `/stats` | Analytics detalhados (progresso ao longo do tempo) |

### Dev
| Rota | Descrição |
|------|-----------|
| `/theme-preview` | Visualização de cores, badges, animações |

---

## 6. Modelo de Negócio (Freemium)

### Free
- Todas as 19 lições da biblioteca
- Explicação via texto
- 3 análises AI por dia
- XP, badges, streaks

### Premium (R$ 9,90/mês ou R$ 79,90/ano)
- **Voice Mode** — explicação por voz (Whisper + fluency)
- **Teach Mode** — Teo (AI estudante)
- **Create Lessons** — geração AI de lições custom
- **Unlimited AI** — sem limite diário
- **Sync** — progresso na nuvem (multi-device)

---

## 7. Dados & Conteúdo

### Biblioteca de Lições (19 lições)
| Categoria | Lições |
|-----------|--------|
| Basics | Introdução, Numbers & Time, Colors |
| Daily Life | At the Restaurant, Doctor Visit, Job Interview, Shopping |
| Travel | Booking a Hotel, Airport Dialogue, Directions |
| Culture | British vs American, Festivals, Slang |
| Business | Presentations, Negotiations, Emails |

### Estrutura de uma Lição
```javascript
{
  id: string,
  title: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  category: string,
  contentType: 'text' | 'video' | 'audio',
  content: string,
  keyPoints: string[],
  vocabulary: string[],
  estimatedMinutes: number,
  xpReward: number
}
```

---

## 8. Fluxos de Usuário

### Fluxo 1: Primeiro Acesso
```
Auth → Onboarding (objetivo/nível) → Placement Test → Home
```

### Fluxo 2: Lição Completa
```
Home → Seleciona Lição → Read (60s) → Explain → AI Feedback
→ [Free] Complete / [Premium] Teach Mode → Complete → XP + Streak
```

### Fluxo 3: Upgrade Premium
```
Pricing → Seleciona Plano → Mercado Pago Checkout (PIX/Boleto/Cartão)
→ Webhook confirma → Premium ativado → Sync progresso
```

### Fluxo 4: Prática de Gaps
```
Home → Ver Gaps → Practice → Exercícios personalizados
→ Fixa gap → XP bonus
```

---

## 9. Identidade Visual

### Cores Principais
| Nome | HEX | Uso |
|------|-----|-----|
| Primary Gradient | `#a78bfa` → `#c084fc` | Botões, XP bar, highlights |
| Background | `#0f0f23` | App background |
| Card | `#1a1a2e` | Cards, containers |
| Text Primary | `#f8fafc` | Títulos |
| Text Secondary | `#94a3b8` | Descrições |
| Success | `#34d399` | Acertos, badges |
| Warning | `#fbbf24` | Streak, atenção |
| Error | `#f87171` | Erros, gaps |

### Tipografia
- **Headings**: Inter, semibold
- **Body**: Inter, regular
- **Badge/Numbers**: JetBrains Mono (monospace)

### Animações
- Page transitions: `AnimatePresence` (fade + slide)
- Buttons: `scale(1.02)` + `box-shadow` on hover
- XP gain: `scale(1.2)` → `scale(1)` + number count-up
- Streak flame: `opacity` pulse + subtle `scale`

---

## 10. Roadmap

### ✅ Concluído (Jun 2025)
- [x] Core lesson flow (read → explain → feedback)
- [x] Voice mode (Whisper)
- [x] Teach mode (Teo)
- [x] Gamification (XP, badges, streaks)
- [x] 19 lições pré-criadas
- [x] Backend seguro (Edge Functions + Supabase)

### ✅ Concluído (Jul 2026)
- [x] Migração de pagamento Stripe/Asaas → Mercado Pago (checkout, assinatura, webhook com verificação HMAC)
- [x] Scaffold Android/Capacitor
- [x] Correção de bugs críticos: CORS do checkout, bypass do rate limit de IA, Premium gates reforçados no servidor (Voice Mode, Teach Mode, Create Lesson)

### Em Progresso
- [ ] App mobile (Capacitor/React Native) — scaffold existe, faltam ajustes nativos (permissão de mic ✅ feita, notificações via Capacitor ✅ feita, decidir estratégia de ditado por voz)
- [ ] SRS (Spaced Repetition) para revisão

### Futuro
- [ ] Comunidade — compartilhar explicações
- [ ] Tutor AI proativo (notificações personalizadas)
- [ ] Mais idiomas (espanhol, francês)

---

## 11. Recursos para Marketing

### Pitch de 30 segundos
> "FeynLearn usa a técnica do Nobel Richard Feynman: você aprende inglês explicando o que leu, com feedback instantâneo de IA. É como ter um professor particular 24/7."

### Diferenciais Competitivos
1. **Ativo vs Passivo** — não assiste vídeos, você *produz* inglês
2. **Feedback imediato** — AI corrige na hora
3. **Gamificação** — XP, badges, streaks engajam
4. **Preço acessível** — 1/10 do custo de aulas particulares

### Target
- Profissionais que precisam de inglês para trabalho
- Estudantes de vestibular/ENEM
- Pessoas que já tentaram outros apps e desistiram (boring)

---

## 12. Configuração de Desenvolvimento

### Variáveis de Ambiente (`.env`)
```bash
# Frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# Edge Functions (secrets)
OPENAI_API_KEY=sk-...
CLERK_JWKS_URL=https://...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Comandos Úteis
```bash
# Dev local
npm run dev

# Supabase local
supabase start
supabase functions serve

# Deploy
supabase functions deploy
npm run build
netlify deploy
```

---

## 13. Troubleshooting

| Problema | Solução |
|----------|---------|
| "Failed to analyze" | Verificar OpenAI key no secret |
| Premium não ativa | Verificar webhook Mercado Pago (assinatura HMAC) |
| Progresso não sync | Verificar Clerk token, network |
| Voice não funciona | Permissão de microfone, HTTPS (produção) |

---

**Documento criado para referência rápida de desenvolvimento, investidores e equipe.**
