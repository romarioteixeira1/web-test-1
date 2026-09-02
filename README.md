# web-test-1

Aplicativo de cadastro de clientes (React + TypeScript no front-end, API em Cloudflare Worker, dados em D1), pronto para deploy na Cloudflare.

## Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 8](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) — tokens de design centralizados em `src/styles/theme.css`
- [Hono](https://hono.dev) rodando como Cloudflare Worker (API REST)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) para persistência
- [@cloudflare/vite-plugin](https://developers.cloudflare.com/workers/vite-plugin/) + [Wrangler](https://developers.cloudflare.com/workers/wrangler/) para dev/deploy full-stack
- [Oxlint](https://oxc.rs) para lint

## Estrutura

```
src/
  api/            cliente HTTP para a API de clientes
  components/     componentes de UI (Header, Footer, formulário e tabela de clientes)
  pages/          páginas (CustomersPage)
  styles/         tokens de design (theme.css) e estilos base (base.css)
worker/
  index.ts        API REST (Hono) — /api/customers (GET/POST/PUT/DELETE)
shared/
  customer.ts     tipos compartilhados entre front-end e Worker
migrations/       migrações SQL do banco D1
wrangler.jsonc    configuração de deploy (Worker + static assets em modo SPA + binding do D1)
```

## Scripts

```bash
npm run dev              # servidor de desenvolvimento (front-end + Worker + D1 local)
npm run build            # build de produção em dist/
npm run preview          # roda o build em modo preview (dentro do runtime da Cloudflare)
npm run lint             # lint com Oxlint
npm run deploy           # build + wrangler deploy (requer login: npx wrangler login)
npm run db:migrate:local # aplica as migrações no D1 local (usado pelo `npm run dev`)
npm run db:migrate:remote # aplica as migrações no D1 remoto (produção)
```

## Banco de dados (D1)

O banco `web-test-1-db` já foi criado na conta Cloudflare e está referenciado em `wrangler.jsonc` (binding `DB`). Ao adicionar uma nova migração em `migrations/`, rode:

```bash
npm run db:migrate:local   # para continuar testando localmente
npm run db:migrate:remote  # para aplicar em produção antes/depois do deploy
```

## Deploy na Cloudflare

1. Autentique o Wrangler (uma única vez): `npx wrangler login`
2. Garanta que as migrações remotas estão aplicadas: `npm run db:migrate:remote`
3. Rode `npm run deploy`

O projeto é servido como Worker com Static Assets em modo SPA (`not_found_handling: single-page-application`), com as rotas `/api/*` roteadas para o Worker (`run_worker_first`) e as demais servidas diretamente como assets estáticos.
