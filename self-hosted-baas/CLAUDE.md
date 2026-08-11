PROJECT NAME
Self-Hosted BaaS — Unified Backend-as-a-Service & Agentic Control Plane

OWNER
Derrick W. Higgins
Higgyd Productions

MISSION
Replace paid, per-service SaaS (Supabase, Neon, Cloudflare, GitHub) with a
self-hosted, open-source stack that Derrick controls end to end: a database
layer, a Git/CI layer, an edge/routing layer, and one small control-plane API
that an AI agent (or Derrick, by hand) can drive to provision and manage
projects "from any source."

This repository already hosts `revenue-os/` (lead-to-conversation CRM) and
`arthur-os/` (order-to-delivery product studio). This project, `self-hosted-baas/`,
is infrastructure, not a product: it is the hosting/deploy/database substrate
those (and future) apps can run on. It lives in its own top-level folder and
does not share a database or codebase with either.

SCOPE OF THIS FIRST SLICE
1. `docs/architecture.md` — the proprietary → open-source component mapping
   and why each piece was chosen.
2. `docs/setup-guide.md` — the actual steps to stand this up on a VPS or an
   old PC, in order, including the free-tier options (Oracle Cloud Always
   Free).
3. `infra/` — a docker-compose stack for the pieces that are plain containers
   (PostgreSQL + pgvector, Gitea, PocketBase) plus a script for installing
   Coolify (which manages its own Docker install and is not itself a compose
   service).
4. `control-plane/` — a small FastAPI wrapper ("the Brain") that exposes a
   handful of REST endpoints an AI agent can call to ask Coolify to create
   applications, trigger deployments, and provision databases, instead of the
   agent needing raw Coolify API credentials and payload knowledge.

NON-NEGOTIABLE GOVERNANCE
1. Derrick W. Higgins is the permanent Root Owner of all infrastructure this
   project touches. No agent has standing authority to provision, deploy, or
   tear down infrastructure without Derrick's turn-by-turn confirmation.
2. This control plane is advisory and execution tooling, not an autonomous
   decision-maker. It does what it is told; it does not decide what to build.
3. Secrets (Coolify API tokens, Gitea tokens, DB passwords) are never
   committed. `.env.example` files document required variables; real values
   live in a local `.env` (gitignored) or the host's secret store.
4. Destructive operations (dropping databases, deleting applications/projects,
   force-pushing to Gitea repos) are not exposed as single-call control-plane
   endpoints without an explicit confirmation step — this mirrors the same
   confirm-before-destructive-action rule Derrick's other projects follow.
5. Every control-plane action should be logged (what was requested, what
   Coolify/Gitea returned) so there is an audit trail of what infrastructure
   was created or changed and when.

NOT YET DECIDED (ask Derrick before building further)
- Where this actually gets hosted (old PC vs. VPS vs. Oracle Cloud Always
  Free) — affects the setup guide's exact commands but not the architecture.
- Whether PocketBase or SelfDB is the BaaS layer for a given app (PocketBase
  is the default in this scaffold since it's the more mature/documented
  option; SelfDB is noted as an alternative).
- Auth model for the control-plane API itself (who/what is allowed to call
  it) once it's deployed somewhere reachable over the network.
