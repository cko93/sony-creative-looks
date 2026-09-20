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
