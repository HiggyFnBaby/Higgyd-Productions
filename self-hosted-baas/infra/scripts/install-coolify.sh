#!/usr/bin/env bash
# Installs Coolify using its official installer.
# Coolify manages its own Docker Engine setup on the host, which is why it's
# not a service in docker-compose.yml alongside Gitea/Postgres/PocketBase.
#
# This script only wraps the official one-liner from https://coolify.io/docs/installation
# so the install command is reviewable in version control instead of being
# piped straight from a `curl | bash` in a chat message.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Coolify's installer requires root. Re-run with sudo." >&2
  exit 1
fi

curl -fsSL https://cdn.coollabs.io/coolify/install.sh -o /tmp/coolify-install.sh
echo "Downloaded installer to /tmp/coolify-install.sh — review it before running."
echo "Run: bash /tmp/coolify-install.sh"
