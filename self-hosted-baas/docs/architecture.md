# Architecture: what replaces what

## Component mapping

| Proprietary platform | Open-source replacement | What it handles | Where it runs |
|---|---|---|---|
| Supabase / Firebase | [PocketBase](https://pocketbase.io/) (default) or [SelfDB](https://github.com/selfdb-io/selfDB) | Relational DB (SQLite), built-in auth, realtime subscriptions, file storage | `infra/docker-compose.yml` |
| Neon (DB branching) | PostgreSQL + [pgvector](https://github.com/pgvector/pgvector), branched via container volumes / schemas; [LiteFS](https://fly.io/docs/litefs/) if going SQLite-first | Isolated dev/staging/prod copies of a database | `infra/docker-compose.yml` (Postgres); LiteFS is opt-in, not included by default |
| Cloudflare (edge/workers) | Docker containers behind [Traefik](https://traefik.io/traefik/) (Coolify's built-in proxy) or [Nginx Proxy Manager](https://nginxproxymanager.com/) | Routing, SSL/TLS, reverse proxy to each app | Managed by Coolify |
| GitHub (code + CI/CD) | [Gitea](https://about.gitea.com/) | Git hosting, issues, and Actions-compatible CI | `infra/docker-compose.yml` |
| Control panel / PaaS | [Coolify](https://coolify.io/) | Deploys from Git, manages Docker builds, SSL, databases, webhooks; exposes a REST API | Installed via its own installer (`infra/scripts/install-coolify.sh`), not a compose service |
| AI agent layer | `control-plane/` (FastAPI) calling the Coolify API | Turns natural-language-ish requests ("spin up a Postgres schema for Project X") into Coolify API calls | This repo |

## Why Coolify isn't in the docker-compose file

Coolify installs and manages its own Docker Engine configuration on the host
and expects to own that layer — running it as just another compose service
fights the tool. It gets its own one-line official installer
(wrapped in `infra/scripts/install-coolify.sh` for convenience/review), and
everything else (Gitea, Postgres+pgvector, PocketBase) can either be deployed
*through* Coolify's UI/API afterward, or run directly via
`infra/docker-compose.yml` if you want them independent of Coolify.

## The vector database angle

Enabling `pgvector` on the same Postgres instance that runs your app data
means agent memory / RAG / semantic search doesn't need a separate paid
vector DB (Pinecone, etc.) — it's a column type and an index on tables you
already have.

## The control plane

`control-plane/` is intentionally thin: it does not reimplement Coolify's
functionality, it wraps a handful of Coolify REST endpoints (list apps,
trigger a deploy, create a database) behind simpler request/response shapes,
so an AI agent (or Derrick, via `curl`) can issue one clear request instead
of hand-building Coolify API payloads each time. See
[`control-plane/README.md`](../control-plane/README.md).
