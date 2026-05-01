# Armada KV Site — Copilot Instructions

This is the landing page and documentation site for [Armada KV](https://github.com/armadakv/armada), a distributed key-value store for Kubernetes.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Markdown**: `react-markdown` + `remark-gfm` (Server Components)
- **Deployment**: Netlify via `@netlify/plugin-nextjs`

## Project Layout

```
scripts/
  sync-docs.mjs          # Build-time docs importer (see below)
src/
  generated/             # Gitignored — created by sync-docs
    docs-manifest.json   # Version index consumed by the site
    docs/<version>/      # Processed markdown files
  lib/
    docs.ts              # Manifest helpers: getManifest, getDocPage, getSidebarSections, getAdjacentPages
  components/
    Nav.tsx              # Top navigation bar (Server Component)
    DocsSidebar.tsx      # Versioned sidebar + version selector ('use client')
    DocsContent.tsx      # react-markdown renderer (Server Component)
  app/
    page.tsx             # Landing page
    docs/
      page.tsx           # Redirect → defaultVersion
      [version]/[...slug]/page.tsx  # Docs reader with generateStaticParams
public/
  docs-static/           # Gitignored — static assets (images) from armada docs
```

## Docs Sync Pipeline

The `scripts/sync-docs.mjs` script runs before every build/dev start via npm `prebuild`/`predev` hooks:

- **Local**: reads from `../armada` (sibling checkout)
- **CI/Netlify**: clones `https://github.com/armadakv/armada.git`

It iterates semver tags + `master` branch (labelled `"main"` in the manifest), copies processed markdown to `src/generated/docs/<version>/`, copies static assets to `public/docs-static/<version>/`, and writes `src/generated/docs-manifest.json`.

To regenerate manually:

```bash
npm run sync-docs
```

## Local Development

```bash
# Requires a sibling armada checkout at ../armada
git clone https://github.com/armadakv/armada.git ../armada
npm install
npm run dev    # syncs docs then starts Next.js dev server
```

## Key Conventions

- **Server Components by default** — only `DocsSidebar` is `'use client'` (needs `useRouter` for version navigation).
- **Docs versions** — the version key `"main"` maps to the `master` branch on GitHub. GitHub links must use `master`, not `main`.
- **GitHub links** — always use `https://github.com/armadakv/armada` as the base; the default branch is `master`.
- **Image paths** — the sync script rewrites `static/*.png` references in markdown to `/docs-static/<version>/` so they resolve correctly in the site.
- **Relative doc links** — the sync script rewrites `[text](other-page.md)` to `/docs/<version>/other-page` site paths.
- **No extra runtime deps** — the sync script uses only Node built-ins + the `git` CLI.

## Manifest Schema

```ts
interface DocsManifest {
  versions: string[]; // only versions with pages, "main" first
  defaultVersion: string; // latest semver tag with pages, or "main"
  byVersion: {
    [version: string]: {
      pages: Array<{
        slug: string[]; // e.g. ["user_guide", "index"]
        title: string; // extracted from first # heading
        file: string; // relative to site root, e.g. "src/generated/docs/main/..."
      }>;
    };
  };
}
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `master`:

1. `npm ci`
2. `node scripts/sync-docs.mjs` (clones armada repo)
3. `npm run lint`
4. `npm run typecheck`

Full build + deploy is handled by Netlify automatically.
