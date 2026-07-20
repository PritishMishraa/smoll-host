# @smoll-host/cli

Publish self-contained HTML documents from a terminal or AI agent.

```bash
npm install --global @smoll-host/cli

export SMOLL_HOST_TOKEN="smoll_..."
smoll deploy ./index.html --site my-docs
```

Use `--json` for stable machine-readable output:

```bash
smoll deploy ./index.html --site my-docs --json
```

Set `SMOLL_HOST_API_URL` when using a self-hosted smoll.host server.
The default hosted API is `https://smoll-host.vercel.app`.
