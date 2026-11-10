<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Presença CONQUITECH-MA

This contains everything you need to run your app locally.

## Configuração do Supabase

1. Crie um projeto no Supabase e aplique a migração em `supabase/migrations/20261110_initial_schema.sql` pelo SQL Editor ou CLI.
2. Crie a primeira conta pelo painel **Authentication > Users**. Em seguida, promova-a no SQL Editor conforme o comentário ao final da migração.
3. Faça o deploy da Edge Function: `supabase functions deploy create-user`.
4. Copie `env.example` para `.env.local` e informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

A chave `SUPABASE_SERVICE_ROLE_KEY` é usada apenas pela Edge Function e nunca deve ser colocada no frontend.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure `.env.local` como indicado acima.
3. Run the app:
   `npm run dev`
