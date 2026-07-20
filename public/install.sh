#!/usr/bin/env bash
# Install the smoll CLI (https://smoll-host.vercel.app/cli).
#
#   curl -fsSL https://smoll-host.vercel.app/install.sh | bash
#
# The CLI is not on npm yet, so this script downloads the repository,
# builds the CLI from source, and installs it globally with npm.
set -euo pipefail

REPO="PritishMishraa/smoll-host"
REF="${SMOLL_INSTALL_REF:-main}"
APP_ORIGIN="https://smoll-host.vercel.app"

info() {
	printf '\033[0;36m==>\033[0m %s\n' "$*"
}

fail() {
	printf 'install.sh: %s\n' "$*" >&2
	exit 1
}

command -v node >/dev/null 2>&1 || fail "Node.js 20 or newer is required (https://nodejs.org)"
command -v npm >/dev/null 2>&1 || fail "npm is required (it ships with Node.js)"
command -v curl >/dev/null 2>&1 || fail "curl is required"
command -v tar >/dev/null 2>&1 || fail "tar is required"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
[ "$NODE_MAJOR" -ge 20 ] || fail "Node.js 20 or newer is required (found $(node --version))"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

info "Downloading ${REPO}@${REF}"
curl -fsSL "https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}" -o "${WORKDIR}/repo.tar.gz" \
	|| fail "Download failed. Check your network connection."
tar -xzf "${WORKDIR}/repo.tar.gz" -C "$WORKDIR"

CLI_DIR="${WORKDIR}/smoll-host-${REF}/cli"
[ -d "$CLI_DIR" ] || fail "Unexpected archive layout: cli/ not found"

info "Building the CLI"
(
	cd "$CLI_DIR"
	npm install --no-audit --no-fund --loglevel=error
	npm run build --silent
	npm pack --silent >/dev/null
)

TGZ_PATH="$(find "$CLI_DIR" -maxdepth 1 -name 'smoll-host-cli-*.tgz' | head -n 1)"
[ -n "$TGZ_PATH" ] || fail "The build did not produce a package tarball"

info "Installing globally"
npm install --global --no-audit --no-fund --loglevel=error "$TGZ_PATH" \
	|| fail "Global install failed. Try: sudo bash or fix your npm global prefix"

if command -v smoll >/dev/null 2>&1; then
	info "Installed $(smoll --version)"
else
	info "Installed. Restart your shell if 'smoll' is not found."
fi

cat <<EOF

Next steps:
  1. Create an API key at ${APP_ORIGIN}/cli
  2. smoll auth set-token "smoll_..."
  3. smoll deploy ./index.html --site my-docs

Docs: ${APP_ORIGIN}/cli
EOF
