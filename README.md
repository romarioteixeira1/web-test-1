# web-test-1

Aplicação web (React + TypeScript) construída com Vite, estilizada com Tailwind CSS v4 e pronta para deploy na Cloudflare (Workers com static assets).

## Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 8](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) — tokens de design centralizados em `src/styles/theme.css`
- [Oxlint](https://oxc.rs) para lint
- [@cloudflare/vite-plugin](https://developers.cloudflare.com/workers/vite-plugin/) + [Wrangler](https://developers.cloudflare.com/workers/wrangler/) para deploy

## Estrutura

```
src/
  components/   componentes de UI (Header, Hero, Footer, ...)
  styles/       tokens de design (theme.css) e estilos base (base.css)
  App.tsx       composição das seções da página
  index.css     entrypoint de estilos (@import do Tailwind + tokens)
wrangler.jsonc  configuração de deploy (Cloudflare static assets / SPA)
```

## Scripts

```bash
npm run dev       # servidor de desenvolvimento (http://localhost:5173)
npm run build     # build de produção em dist/
npm run preview   # roda o build em modo preview (dentro do runtime da Cloudflare)
npm run lint      # lint com Oxlint
npm run deploy    # build + wrangler deploy (requer login: npx wrangler login)
```

## Deploy na Cloudflare

1. Autentique o Wrangler (uma única vez): `npx wrangler login`
2. Ajuste `name` em `wrangler.jsonc` se quiser outro nome de projeto/subdomínio
3. Rode `npm run deploy`

O projeto é servido como Workers Static Assets em modo SPA (`not_found_handling: single-page-application`), então rotas do lado do cliente (ex. React Router) funcionam sem configuração extra.
