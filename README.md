# smoll.host

Host a self-contained HTML document from the web, a terminal, or an AI agent.

## CLI

Build the CLI from this repository:

```bash
pnpm install
pnpm cli:build
node cli/dist/cli.js --help
```

Create an API key in the **CLI API keys** section of the signed-in dashboard, then configure it:

```bash
export SMOLL_HOST_TOKEN="smoll_..."
export SMOLL_HOST_API_URL="http://localhost:3000" # omit in production
```

Publish a local HTML document:

```bash
node cli/dist/cli.js deploy ./index.html --site my-docs
```

AI agents and CI jobs should use stable JSON output:

```bash
node cli/dist/cli.js deploy ./index.html --site my-docs --json
```

Documents can also be streamed over stdin:

```bash
generate-docs | node cli/dist/cli.js deploy - --site my-docs --json
```

Other commands:

```bash
smoll sites list --json
smoll sites download my-docs --output ./index.html
smoll sites delete my-docs --yes --json
smoll auth set-token "smoll_..."
smoll auth status --json
```

The CLI requires Node.js 20 or newer. It accepts one self-contained `.html` or `.htm` document up to 16 MB. API keys are hashed at rest, expire after 90 days, are rate limited, and can only operate on sites owned by their user.

The machine-readable API contract is available at [`/openapi.json`](public/openapi.json).

> [!NOTE]  
> The hosted content is currently displayed through a subdomain of [pritish.in](https://pritish.in). This is achieved using a reverse proxy written in Go, available at [this GitHub repo](https://github.com/PritishMishraa/go-reverse-proxy).

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [AWS S3](https://aws.amazon.com/s3/)
- [Neon Postgres](https://neon.tech/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://better-auth.com/)
- [Redis Cloud](https://redis.io/cloud/)
- [React Dropzone](https://react-dropzone.js.org/)
- [Sonner](https://sonner.emilkowal.ski/)
- [NextUI v2](https://nextui.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)


## How Files are uploaded
![file upload](image.png)

## How to Use

### CLone the repository

```bash
git clone https://github.com/PritishMishraa/smoll-host.git
```

### Install dependencies


```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

### Environment variables

Copy `.env.example` to the Git-ignored `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```dotenv
AWS_BUCKET_NAME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

DATABASE_URL=
REDIS_URL=
REDIS_TLS=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_PUBLIC_HOST=pritish.in

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

`DATABASE_URL` comes from Neon. `REDIS_URL` comes from Redis Cloud and is used as a fast cache for domain name lookups; Neon remains the source of truth for ownership. Prefer a `rediss://` Redis Cloud URL. If your Redis Cloud URL is `redis://` but the endpoint requires TLS, set `REDIS_TLS=true`.

This repo was set up with `bunx neonctl`; useful commands are:

```bash
bunx neonctl projects list
bunx neonctl connection-string
pnpm db:generate
pnpm db:migrate
```

Run `pnpm db:migrate` after pulling the CLI implementation. Migration `0002` creates the hashed API-key table required by Better Auth.

`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` come from a GitHub OAuth app. For local development, set the callback URL to:

```text
http://localhost:3000/api/auth/callback/github
```

### Production checklist

- Set `BETTER_AUTH_SECRET` to a cryptographically random value of at least 32 characters.
- Set `BETTER_AUTH_URL` to the deployed HTTPS application origin.
- Configure the production GitHub OAuth callback as `<BETTER_AUTH_URL>/api/auth/callback/github`.
- Use a private S3 bucket and set `AWS_BUCKET_NAME` and `AWS_REGION`.
- Set both AWS access-key variables, or omit both when the deployment uses an IAM role.
- Set `NEXT_PUBLIC_PUBLIC_HOST` to the wildcard host served by the reverse proxy.
- Set `REDIS_URL` when cross-instance domain lookup caching is required; Redis remains optional.
- Run `pnpm db:migrate` before directing production traffic to a new release.
- Configure the deployment platform to probe `/api/health`; it returns `503` until configuration, Neon, and S3 are ready.

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@nextui-org/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/nextui-org/next-app-template/blob/main/LICENSE).
