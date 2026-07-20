# smoll CLI

The `smoll` CLI publishes self-contained HTML documents to a smoll.host server. It is designed for people, CI jobs, and AI agents.

## Current installation on this machine

The locally built CLI is installed globally:

```text
/Users/user/.nvm/versions/node/v26.1.0/bin/smoll
```

Installed version:

```text
0.1.1
```

Verify it at any time:

```bash
smoll --version
smoll --help
```

This installation belongs to the active NVM Node.js version. Switching Node.js versions with NVM may require reinstalling the CLI for that version.

## Requirements

- Node.js 20 or newer
- A running smoll.host server
- A dashboard-generated API key
- One self-contained `.html` or `.htm` document, no larger than 16 MB

## Install from this repository

Until the package is published to npm, build and install it from the repository:

```bash
git clone https://github.com/PritishMishraa/smoll-host.git
cd smoll-host

pnpm install
pnpm cli:build
npm install --global ./cli
```

To update an existing local installation after pulling changes:

```bash
pnpm install
pnpm cli:build
npm install --global ./cli
```

## Future npm installation

After `@smoll-host/cli` is published to npm, users will be able to install it with:

```bash
npm install --global @smoll-host/cli
```

Or invoke it without a permanent global installation:

```bash
npx @smoll-host/cli deploy ./index.html --site my-docs
```

The package is configured for npm distribution, but it has not been published yet.

## Create an API key

1. Sign in to the smoll.host dashboard.
2. Open **CLI API keys**.
3. Give the key a recognizable name.
4. Select **Create API key**.
5. Copy the `smoll_...` value immediately. It is shown only once.

Keys are hashed at rest, expire after 90 days, and are restricted to the sites owned by their user.

## Configure authentication

Store the key in the CLI's private configuration file:

```bash
smoll auth set-token "smoll_..."
```

Check the active configuration:

```bash
smoll auth status
smoll auth status --json
```

The default configuration file is:

```text
~/.config/smoll/config.json
```

It is created with owner-only file permissions.

For AI agents and CI, prefer an environment variable:

```bash
export SMOLL_HOST_TOKEN="smoll_..."
```

Environment configuration takes precedence over the stored token.

## Configure the API origin

The default API origin is:

```text
https://smoll-host.vercel.app
```

For local development or a self-hosted deployment:

```bash
export SMOLL_HOST_API_URL="http://localhost:3000"
```

You can also pass it to an individual command:

```bash
smoll sites list --api-url "http://localhost:3000"
```

## Publish HTML

Create or update a site:

```bash
smoll deploy ./index.html --site my-docs
```

The resulting public URL is returned after the upload.

Upload HTML from stdin:

```bash
generate-docs | smoll deploy - --site my-docs
```

Use stable machine-readable output for agents and CI:

```bash
smoll deploy ./index.html --site my-docs --json
```

Example response:

```json
{
  "ok": true,
  "created": true,
  "bytes": 18427,
  "sha256": "4cb3...",
  "site": {
    "name": "my-docs",
    "url": "https://my-docs.pritish.in"
  }
}
```

## Manage sites

List sites:

```bash
smoll sites list
smoll sites list --json
```

Download a site's HTML:

```bash
smoll sites download my-docs
smoll sites download my-docs --output ./index.html
```

The CLI will not replace an existing output file unless explicitly authorized:

```bash
smoll sites download my-docs --output ./index.html --force
```

Delete a site and its uploaded HTML:

```bash
smoll sites delete my-docs --yes
smoll sites delete my-docs --yes --json
```

The required `--yes` flag prevents accidental non-interactive deletion.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SMOLL_HOST_TOKEN` | API key used for authentication |
| `SMOLL_HOST_API_URL` | API origin, overriding `https://smoll-host.vercel.app` |
| `SMOLL_CONFIG_DIR` | Overrides the directory containing CLI configuration |
| `XDG_CONFIG_HOME` | Standard fallback configuration root |

## JSON errors and exit codes

With `--json`, failures are written to stderr:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The API key is invalid",
    "requestId": "..."
  }
}
```

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | API, network, or unexpected failure |
| `2` | Invalid arguments, unsafe overwrite, or missing confirmation |
| `3` | Missing or rejected authentication |

## Security guidance

- Do not commit API keys or database credentials.
- Prefer environment secrets in CI and agent environments.
- Do not pass credentials in generated HTML.
- Revoke a key from the dashboard when an agent no longer needs access.
- Use `--json` for automation and inspect nonzero exit codes.
- Keep uploaded documents self-contained; directory and asset uploads are not currently supported.

## Uninstall

Remove the global installation:

```bash
npm uninstall --global @smoll-host/cli
```
