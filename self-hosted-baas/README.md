# Self-Hosted BaaS — Unified Backend-as-a-Service

A self-hosted, open-source replacement for the "pay five SaaS providers"
stack (Supabase, Neon, Cloudflare, GitHub), stitched together with Docker and
driven by a small AI-friendly control-plane API instead of five separate
dashboards.

Start here:

- [`CLAUDE.md`](CLAUDE.md) — mission, scope, and the governance rules any
  agent working in this folder must follow.
- [`docs/architecture.md`](docs/architecture.md) — what replaces what, and
  why.
- [`docs/setup-guide.md`](docs/setup-guide.md) — the actual steps, in order,
  to stand this up (including free-tier hosting options).
- [`infra/`](infra/) — the docker-compose stack (Postgres + pgvector, Gitea,
  PocketBase) and the Coolify install script.
- [`control-plane/`](control-plane/) — "the Brain": a FastAPI wrapper around
  Coolify's API so an AI agent can provision/deploy with plain requests
  instead of raw Coolify payloads.

## Status

First slice: architecture docs + setup guide + docker-compose stack +
control-plane skeleton with the core endpoints (list/deploy applications,
create databases). Not yet deployed to real infrastructure — no live
Coolify/Gitea instance is connected to this repo. Nothing here talks to a
real server until Derrick stands one up and fills in `.env`.
