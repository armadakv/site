# Armada KV Site

The official website for [Armada KV](https://github.com/armadakv/armada) — a distributed key-value store. This site combines a landing page with a full documentation site, both served from a single Next.js application deployed on Netlify.

## Local Development

### Prerequisites

- Node.js 20+
- The `armada` repository cloned as a sibling directory (`../armada`) **or** internet access for the CI remote-clone path

### Setup

```bash
# From the repo root, clone the armada sibling if you haven't already
git clone https://github.com/armadakv/armada.git ../armada

# Install dependencies
cd site
npm install

# Start the development server (docs are synced automatically via prebuild)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Docs Sync

Documentation is pulled from the `armada` repository's `docs/` directory by `scripts/sync-docs.mjs`, which runs automatically as part of the `prebuild` npm script before every build.

| Mode            | Trigger                                         | Behaviour                                     |
| --------------- | ----------------------------------------------- | --------------------------------------------- |
| **Local**       | `../armada` directory exists                    | Copies docs from the local sibling checkout   |
| **CI / remote** | `../armada` absent, or `FORCE_REMOTE_DOCS=true` | Shallow-clones the repo via `ARMADA_REPO_URL` |

See `.env.example` for available environment variables.

## Netlify Deployment

The site is deployed to Netlify using [`@netlify/plugin-nextjs`](https://github.com/netlify/netlify-plugin-nextjs), which enables full SSR/ISR support alongside statically exported docs pages.

Key configuration lives in `netlify.toml`:

- **Build command**: `npm run build` (triggers `prebuild` → docs sync → Next.js build)
- **Publish directory**: `.next`
- **Node version**: 20

No extra Netlify environment variables are required for a basic deployment. Set `ARMADA_REPO_URL` only if you need to pull docs from a fork.

## Project Structure

```
site/
├── public/              # Static assets (favicons, og images, etc.)
│   └── docs-static/     # Synced static assets from armada/docs/
├── scripts/
│   └── sync-docs.mjs    # Docs sync script (run before build)
├── src/
│   └── app/             # Next.js App Router pages & layouts
│       ├── page.tsx     # Landing page
│       └── docs/        # Documentation pages
├── netlify.toml         # Netlify build & plugin configuration
├── next.config.ts       # Next.js configuration
└── .env.example         # Documented environment variables
```
