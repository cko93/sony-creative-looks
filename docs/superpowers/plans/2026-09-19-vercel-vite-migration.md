# Vercel Vite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Sony a7C II field guide from its Cloudflare/Sites Vinext runtime to a reproducible static Vite build ready for automatic Vercel deployments from GitHub.

**Architecture:** Vite serves `index.html` and a browser entry that imports the existing guide stylesheet and mounts the existing React component. The guide remains a fully client-side static bundle in `dist/`; Vercel releases that bundle only after the repository quality gate passes.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS/PostCSS 4, ESLint 9, Vitest, Testing Library, Vercel, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-09-19-vercel-github-deployment-design.md`

## Global Constraints

- Preserve all current guide interactions and static recipe content; add no APIs, accounts, storage, or server routes.
- Use Vite's `dist/` as the production artifact and never commit generated output.
- Keep Tailwind's existing PostCSS processing active while `app/globals.css` imports `tailwindcss`.
- Make `pnpm build` run type-checking and linting before `vite build`.
- Pin Node to `22.x` and package manager to `pnpm@11.19.0`.
- Remove Cloudflare/Sites/Vinext/Next files only once no replacement code consumes them.
- Do not commit Vercel credentials, tokens, or project settings.

## Review Focus

- A type or lint error must fail the Vercel production build rather than deploy a transpiled-but-invalid bundle.
- `index.html` must preserve the language, viewport, title, description, and favicon that currently live in the Next layout.
- The Vite browser entry must load the stylesheet before rendering the field guide.
- Photo/movie/setup tabs, recipe filtering, card expansion, and external source links must work in the Vite bundle.
- The deployed application must not load the old Cloudflare/Sites/Vinext/Next runtime.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `package.json` and `pnpm-lock.yaml` | Reproducible Vite, check, test, preview, Node, and pnpm setup. |
| `vite.config.ts` | React, Tailwind PostCSS, and Vitest configuration. |
| `tsconfig.json` and `eslint.config.mjs` | Framework-neutral TypeScript and lint configuration. |
| `.gitignore` | Ignores Vite, test, Vercel, and other generated files. |
| `index.html` | Vite document shell and migrated metadata. |
| `src/main.tsx` | Imports stylesheet and mounts `Home` into `#root`. |
| `test/setup.ts` and `app/page.test.tsx` | Browser DOM setup and guide regression coverage. |
| `app/page.tsx` | Existing guide behavior and static recipe data. |
| `app/layout.tsx`, `next.config.ts`, `.openai/hosting.json` | Removed legacy runtime files. |
| `README.md` | Local commands and one-time GitHub-to-Vercel setup. |

### Task 1: Establish framework-neutral quality and test tooling

**Files:**
- Create: `test/setup.ts`
- Create: `app/page.test.tsx`
- Modify: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`

**Interfaces:**
- Consumes: `Home` as the default export from `app/page.tsx`.
- Produces: `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm preview` for Tasks 2–3 and Vercel.

- [ ] **Step 1: Add regression tests before creating the Vite document**

Create `test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Create `app/page.test.tsx`:

```tsx
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

describe('Sony field guide', () => {
  it('switches from photo looks to the movie bank', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole('button', { name: 'Movie bank' }));
    expect(screen.getByRole('heading', { name: 'Motion, mapped.' })).toBeInTheDocument();
  });

  it('filters photo-look cards', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.type(screen.getByRole('textbox', { name: 'Search recipes' }), 'pacific');
    expect(screen.getByRole('heading', { name: 'Pacific Blues' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Kodachrome 64' })).not.toBeInTheDocument();
  });

  it('expands a card and retains its source link', async () => {
    const user = userEvent.setup();
    render(<Home />);
    const card = screen.getByRole('button', { name: /Pacific Blues/i });
    expect(card).toHaveAttribute('aria-expanded', 'false');
    await user.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Open photo + source recipe ↗' })).toHaveAttribute('target', '_blank');
  });

  it('defines deployed metadata in index.html', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('<title>A7C II Field Looks</title>');
    expect(html).toContain('name="description"');
    expect(html).toContain('/favicon.svg');
  });

  it('loads the existing stylesheet from the browser entry', async () => {
    const entry = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
    expect(entry).toContain("import '../app/globals.css';");
  });
});
```

- [ ] **Step 2: Install the replacement test and lint dependencies**

Run:

```powershell
pnpm add -D @eslint/js @testing-library/jest-dom @testing-library/react @testing-library/user-event globals jsdom typescript-eslint vitest
pnpm remove @cloudflare/vite-plugin @cloudflare/workers-types @openai/sites-vite-plugin @vitejs/plugin-rsc eslint-config-next next react-server-dom-webpack vinext wrangler
```

Expected: only React, React DOM, Vite, `@vitejs/plugin-react`, Tailwind, PostCSS, TypeScript, and the new quality/test dependencies remain.

- [ ] **Step 3: Make builds enforce the quality gate**

Set the relevant `package.json` fields to:

```json
{
  "engines": { "node": "22.x" },
  "packageManager": "pnpm@11.19.0",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "check": "pnpm typecheck && pnpm lint",
    "test": "vitest run",
    "build": "pnpm check && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 4: Replace runtime, TypeScript, ESLint, and ignore configuration**

Replace `vite.config.ts` with:

```ts
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  test: { environment: 'jsdom', setupFiles: './test/setup.ts' },
});
```

Replace `eslint.config.mjs` with:

```js
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', 'node_modules/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], languageOptions: { globals: globals.browser } },
  { files: ['vite.config.ts'], languageOptions: { globals: globals.node } },
]);
```

In `tsconfig.json`, remove the Cloudflare types, Next plugin, `next-env.d.ts`, and `.next` includes; retain strict mode, bundler resolution, React JSX, Node types, and the `@/*` alias. In `.gitignore`, ignore `dist/`, `coverage/`, `.vite/`, and `.vercel/`; remove Next/Vinext-only lines.

- [ ] **Step 5: Verify the pre-implementation test failure**

Run:

```powershell
pnpm test
```

Expected: interaction tests pass; the document-metadata and stylesheet-entry tests fail with `ENOENT`, because `index.html` and `src/main.tsx` do not exist yet.

- [ ] **Step 6: Commit the tooling baseline**

```powershell
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json eslint.config.mjs .gitignore test/setup.ts app/page.test.tsx
git commit -m "chore: prepare Vite quality tooling"
```

### Task 2: Create the static document and browser entry

**Files:**
- Create: `index.html`, `src/main.tsx`
- Modify: `app/page.tsx:1`
- Delete: `app/layout.tsx`, `next.config.ts`, `.openai/hosting.json`

**Interfaces:**
- Consumes: `Home` from `app/page.tsx`, `app/globals.css`, and `public/favicon.svg`.
- Produces: a Vite static site mounted at `#root` with the metadata asserted by Task 1.

- [ ] **Step 1: Create `index.html` to satisfy the failing metadata test**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>A7C II Field Looks</title>
    <meta name="description" content="An audited pocket reference for Sony a7C II Picture Profile translations, published Fujifilm targets, memory slots, and movie LUTs." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Add the browser entry and keep the stylesheet in the bundle**

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import Home from '../app/page';

const root = document.getElementById('root');

if (!root) throw new Error('The Vite document must contain a #root element.');

createRoot(root).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
```

Remove only the first-line `'use client';` directive from `app/page.tsx`; do not change the guide logic or recipe data.

- [ ] **Step 3: Remove migrated legacy files and prove no runtime references remain**

Delete `app/layout.tsx`, `next.config.ts`, and `.openai/hosting.json`. Then run:

```powershell
rg -n "vinext|next/|from 'next'|@cloudflare|@openai/sites|hosting\.json|app-router-entry" --glob '!pnpm-lock.yaml' --glob '!docs/**'
```

Expected: no matches. Keep `public/favicon.svg`, because `index.html` references it.

- [ ] **Step 4: Verify the migrated application**

Run:

```powershell
pnpm test
pnpm build
Get-ChildItem -Recurse dist | Select-Object FullName
```

Expected: all five tests pass; `pnpm build` runs `pnpm check` first, then produces `dist/index.html`, hashed static assets, and the favicon with no Next or Cloudflare worker artifact.

- [ ] **Step 5: Commit the Vite migration**

```powershell
git add index.html src/main.tsx app/page.tsx app/layout.tsx next.config.ts .openai/hosting.json vite.config.ts tsconfig.json eslint.config.mjs package.json pnpm-lock.yaml .gitignore
git commit -m "feat: migrate guide to static Vite"
```

### Task 3: Document Vercel delivery and complete release verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: `pnpm build`, `pnpm preview`, and `dist/` from Task 2.
- Produces: precise local and Vercel Git deployment instructions.

- [ ] **Step 1: Create `README.md` with local and Vercel instructions**

```markdown
# Sony Creative Looks

Static field guide for Sony a7C II photo and movie looks.

## Local development

- `pnpm install --frozen-lockfile`
- `pnpm test`
- `pnpm build`
- `pnpm preview`

Use Node 22.x and pnpm 11.19.0.

## Deploy with Vercel

1. Push this repository to GitHub.
2. Import it in Vercel and select the Vite preset if it is not auto-detected.
3. Set Production Branch to `main`, Build Command to `pnpm build`, Node.js to `22.x`, and Output Directory to `dist`.
4. Push to `main` for production; push another branch for a preview deployment.

Vercel credentials and project settings stay outside this repository.
```

- [ ] **Step 2: Run the final automated release gate**

Run:

```powershell
pnpm check
pnpm test
pnpm build
```

Expected: each command exits 0, and the build command reruns `pnpm check`, proving Vercel cannot bypass type-checking or linting.

- [ ] **Step 3: Check the built guide using Vite's static preview**

Run:

```powershell
pnpm preview -- --host 127.0.0.1
```

Expected: Vite prints a local address serving `dist/`. In a browser, verify styling plus the Photo looks, Movie bank, Quick setup, Pacific Blues search, Pacific Blues card expansion, and external recipe-source link. Stop the server after checking.

- [ ] **Step 4: Inspect the final repository state**

Run:

```powershell
git status --short
git diff --check HEAD
rg -n "vinext|next/|from 'next'|@cloudflare|@openai/sites|hosting\.json|app-router-entry" --glob '!pnpm-lock.yaml' --glob '!docs/**'
```

Expected: no generated assets are tracked, no whitespace errors exist, and no legacy runtime reference remains outside the lockfile or historical documentation.

- [ ] **Step 5: Commit the deployment instructions**

```powershell
git add README.md
git commit -m "docs: explain Vercel deployment"
```
