# FeynLearn — Checklist de Build e Publicação Mobile

Data: 11/07/2026

Este documento cobre o que já foi feito no código e o que falta — em especial os passos que exigem Android Studio, Xcode ou um Mac, que não existem neste ambiente e por isso não puderam ser executados ou verificados aqui.

---

## O que já está pronto no código

- Scaffold Android (`android/`) e iOS (`ios/App/`) gerados via Capacitor 8, sincronizados com o build mais recente (`npx cap sync`).
- Permissão de microfone: `RECORD_AUDIO` no `AndroidManifest.xml` + handshake de runtime permission em `MainActivity.java`; `NSMicrophoneUsageDescription` no `Info.plist` do iOS (no iOS o WKWebView pede a permissão nativamente, não precisa de código Swift extra).
- Notificações de streak via `@capacitor/local-notifications` (nativo) com fallback para a API `Notification` do navegador (web).
- Deep link de retorno do checkout: listener `appUrlOpen` (`@capacitor/app`) já conectado ao React Router em `src/App.jsx` (`DeepLinkHandler`). Falta só a configuração de domínio (ver abaixo).
- Estado crítico (XP, progresso, streak, premium) migrado de `localStorage` puro para `@capacitor/preferences` no nativo, via `src/services/nativeStorage.js` — mais resistente a limpezas de dados do app pelo Android/iOS.
- Scripts novos no `package.json`: `npm run cap:sync` (build + sync), `npm run cap:open:android`, `npm run cap:open:ios`.
- `npm run build` e `npx cap sync` rodados com sucesso neste ambiente — o bundle web e os projetos nativos estão sincronizados com o código atual.

## O que só dá pra fazer com Android Studio / Xcode reais

Nada disso pôde ser testado neste ambiente (sem SDK Android, sem macOS/Xcode):

1. **Abrir e buildar o projeto Android**: `npm run cap:open:android` (exige Android Studio instalado). Testar num device/emulador real:
   - Fluxo de permissão de microfone (Voice Mode) — a lógica está implementada mas nunca rodou numa WebView real.
   - Notificações locais de streak.
   - Comportamento do checkout Mercado Pago (hoje volta pela Custom Tab + polling, não pelo deep link — ver seção seguinte).
2. **Gerar keystore de release** (`keytool -genkeypair ...`) e configurar assinatura no `android/app/build.gradle` — necessário para gerar um AAB/APK de release e para calcular o SHA-256 usado no `assetlinks.json`.
3. **Abrir e buildar o projeto iOS**: `npm run cap:open:ios` (exige Mac + Xcode). Passos que só acontecem lá dentro:
   - `pod install` (CocoaPods só roda em macOS).
   - Configurar Signing & Capabilities (Team, Bundle ID já é `com.feynlearn.app`).
   - Adicionar a capability **Associated Domains** (necessária para o deep link funcionar como Universal Link) — isso cria o arquivo `.entitlements` automaticamente; não existe ainda porque depende dessa ação manual no Xcode.
4. Testar em device/simulador iOS real o fluxo de microfone, notificações e checkout.

## Pendente de domínio de produção (você disse que ainda não publicou)

O checkout do Mercado Pago abre via `@capacitor/browser` (uma aba in-app) e o `back_urls` aponta pra `APP_URL/pricing?payment=...`. Hoje isso é só uma URL https normal — sem o passo abaixo, o pagamento até funciona (a tela web faz o polling e confirma), mas o usuário fica "preso" na aba do navegador em vez de voltar automaticamente pro app nativo.

Quando tiver a URL de produção definitiva:

1. Definir `APP_URL` real nos secrets das Edge Functions do Supabase.
2. **Android**: hospedar `https://<seu-domínio>/.well-known/assetlinks.json` com o SHA-256 do keystore de release (`keytool -list -v -keystore seu.keystore`). Depois, descomentar o bloco de `intent-filter` já deixado pronto em `android/app/src/main/AndroidManifest.xml` (procure por "App Links for the Mercado Pago checkout return"), trocando `YOUR_PRODUCTION_DOMAIN` pelo host real.
3. **iOS**: hospedar `https://<seu-domínio>/.well-known/apple-app-site-association` e habilitar Associated Domains no Xcode (`applinks:<seu-domínio>`).
4. Sem isso, o app continua funcionando (fallback: polling manual), só não é tão fluido — não é bloqueante para uma primeira versão.

## Antes de submeter às lojas

- Ícones e splash screen: Capacitor já gerou os padrões do template; vale substituir pelos ícones reais do FeynLearn antes de submeter (Android: `android/app/src/main/res/mipmap-*`; iOS: `ios/App/App/Assets.xcassets`).
- Política de privacidade: obrigatória para ambas as lojas — precisa cobrir Clerk (auth), Supabase (dados de progresso), OpenAI (conteúdo enviado pra análise) e Mercado Pago (dados de pagamento).
- Justificativa de permissão de microfone: tanto Google Play quanto App Store pedem uma descrição clara de uso de microfone na ficha do app — já existe o texto em `NSMicrophoneUsageDescription` (iOS); no Android, a Play Console pede uma declaração similar no formulário de "Sensitive permissions".
- Ditado por voz (Web Speech API) não funciona no Android/iOS nativo — combinamos deixar assim por enquanto (Voice Mode via Whisper já cobre o caso de uso principal). Se decidir revisitar, é `@capacitor-community/speech-recognition`.

## Ordem sugerida

1. Rodar `npm run cap:open:android`, testar o fluxo completo num device Android real.
2. Gerar keystore de release, testar build assinado.
3. Definir domínio de produção → configurar App Links (assetlinks.json) → descomentar intent-filter.
4. Repetir para iOS (precisa de Mac).
5. Trocar ícones/splash, escrever política de privacidade, submeter.
