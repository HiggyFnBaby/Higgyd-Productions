# Setup guide

Order matters: host → Coolify → the compose stack → connect the control
plane. Every step below is a manual, confirm-as-you-go step — nothing in
this repo runs any of these against a real server automatically.

## 1. Pick a host

- **Free, cloud:** [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/) —
  up to 4 ARM Ampere CPUs / 24 GB RAM, no time limit. Most generous free
  option for this stack.
- **Free, local:** any old PC/mini-PC you already own, with Docker installed.
- **Cheap, cloud:** any small VPS (Hetzner, DigitalOcean, etc.) if you'd
  rather not deal with Oracle's signup friction.

Requirements either way: a Linux host, Docker + Docker Compose, and (for a
cloud host) a way to open ports 80/443 for the reverse proxy.

## 2. Install Coolify

```bash
bash infra/scripts/install-coolify.sh
```

This just wraps Coolify's official one-line installer
(`curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`) so it's
reviewable before you run it instead of piping straight to bash blind.
Coolify prints a dashboard URL and initial admin credentials when it
finishes — save those.

## 3. Bring up the rest of the stack

```bash
cd infra
cp .env.example .env   # fill in real passwords/tokens before starting
docker compose up -d
```

This starts:
- `postgres` — Postgres 16 with `pgvector` enabled, for app data + AI/RAG
  vector storage.
- `gitea` — self-hosted Git + CI, your GitHub replacement.
- `pocketbase` — lightweight instant BaaS (auth, realtime, storage) for
  small apps that don't need full Postgres.

You can also deploy Gitea/PocketBase *through* Coolify's UI instead of this
compose file, if you'd rather manage everything from one dashboard — the
compose file is here for anyone who wants these services independent of
Coolify, or wants to test the stack before Coolify is set up.

## 4. Get a Coolify API token

Coolify dashboard → Keys & Tokens → create a new API token. This is what the
control plane uses to act on your behalf — treat it like a root password.

## 5. Run the control plane

```bash
cd control-plane
cp .env.example .env   # set COOLIFY_URL and COOLIFY_API_TOKEN
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

See [`control-plane/README.md`](../control-plane/README.md) for the
available endpoints.

## 6. Point an AI agent at it

Once the control plane is reachable, an AI agent with plain HTTP access
(or an MCP wrapper around these same endpoints) can issue requests like
"create a database for Project X" by calling `POST /databases` instead of
needing raw Coolify credentials. Keep the control plane's own network
exposure narrow (localhost, VPN, or behind auth) until an auth story is
decided — see the "not yet decided" note in `../CLAUDE.md`.
