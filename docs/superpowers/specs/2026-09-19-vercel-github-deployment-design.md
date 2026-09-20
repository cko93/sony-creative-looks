# Sony Creative Looks Vercel Deployment Design

**Date:** 2026-09-19  
**Status:** Approved for implementation

## Goal

Publish the existing Sony a7C II field guide as a public Vercel site connected to a GitHub repository. Preserve the guide's current visual design, recipe data, search, tabs, expandable cards, and external source links.

## Context

The project currently runs through a Cloudflare/Sites-specific Vinext configuration. The guide itself is a client-side React interface with all recipe data embedded in the page; it has no server-side routes, user data, API calls, or storage dependencies.

## Chosen Approach

Convert the project to a conventional Vite single-page application and deploy its static `dist/` build output on Vercel.

Vercel will be connected to the GitHub repository outside this codebase. Once connected:

- Pushes to `main` produce production deployments.
- Pushes to other branches produce preview deployments.
- Deployment status and build logs are available in Vercel.

No GitHub Pages workflow, generated deployment branch, or GitHub Actions configuration is required.

## Architecture

### Application entry

- Add a browser entry point that imports `app/globals.css` and mounts the existing React field-guide component with `createRoot`.
- Add the HTML document entry point required by Vite. It must retain the current document language, viewport, title, description, and favicon metadata, which currently live in the Next layout.
- Retain the current guide component and stylesheet as the guide's source; remove the now-unnecessary `use client` directive from the component.
- Remove the unused Next layout, Next configuration, Next environment declarations, and other framework-specific files after their metadata and configuration responsibilities have been migrated.

### Build configuration

- Replace the Cloudflare/Sites/Vinext Vite configuration with a conventional React Vite configuration.
- Preserve Tailwind's existing PostCSS processing rather than assuming its stylesheet import is inert; the conversion must explicitly retain the `tailwindcss` and `@tailwindcss/postcss` toolchain or remove the import only after a visual comparison proves it is unnecessary.
- Update package scripts to use `vite`, `vite build`, and `vite preview`. Add `typecheck` and `check` scripts, and make the production `build` script run `check` before `vite build` so every Vercel release is linted and type-checked.
- Replace the Next-specific ESLint configuration with framework-neutral React and TypeScript rules, and remove Next and Cloudflare type references from TypeScript configuration.
- Remove dependencies used solely for the old Cloudflare/Sites/Vinext and Next runtimes after the replacement configuration has no consumers.
- Pin Node to the intended supported major (`22.x`) and add an exact `packageManager` version compatible with the checked-in pnpm lockfile for repeatable Vercel builds.
- Keep the production output in Vite's default `dist/` directory.

### Vercel configuration

- Add repository-level Vercel configuration only if needed to make the Vite build command and `dist/` output explicit.
- Do not add credentials, tokens, or deployment secrets to the repository.

## Data and behavior

- Recipe and movie-look data remain embedded static data compiled into the client bundle.
- Recipe filtering, tab selection, and expanded-card state remain browser-only interactions.
- Source-photo links continue to open the attributed Fuji X Weekly reference pages in a new tab.
- The published site has no runtime dependence on the old Cloudflare/Sites platform.

## Failure handling

- Dependency installation, type-check, lint, and build failures block a release because the Vercel production build runs the repository's `build` script.
- Vercel's deployment logs expose failures after the GitHub integration is enabled.
- External Fuji image hosts are not controlled by this deployment; unavailable remote images will continue to fail gracefully as image backgrounds without affecting the guide's controls or text.

## Verification

Before handoff, verify:

1. Type-check and lint pass through the repository `check` script.
2. A production build succeeds and produces `dist/`.
3. A local static preview serves the built guide with its existing styling and document metadata.
4. Core interactions work: tab switching, recipe search, card expansion, and external source links.
5. No Cloudflare/Sites, Vinext, or Next-only runtime configuration remains in the build path.

## One-time user setup

1. Create or push this project to a GitHub repository.
2. Import that repository into Vercel and select the Vite framework preset if it is not auto-detected.
3. Confirm the Vercel Production Branch is `main`, the Build Command is `pnpm build`, the Node version is 22.x, and the output directory is `dist/`.
4. Merge or push to `main` to create the first production deployment.
