# Arthur Digital Works OS

A one-person, AI-operated white-label product studio — the full master
prompt is in `CLAUDE.md`. This is a separate project from `../revenue-os` in
this repo; see `CLAUDE.md` for how they relate.

## Start here

- `CLAUDE.md` — the mission, governance rules, operating modes, and full
  target scope.
- `docs/architecture.md` — target architecture and exactly what v1 builds.
- `docs/threat-model.md` — assets, actors, and mitigations.
- `docs/data-schema.md` — v1's Prisma schema and the full-platform target
  schema it maps onto.
- `docs/approval-policy-matrix.md` — what's gated behind an owner click,
  today and in the target design.
- `docs/vertical-slice-plan.md` — exactly what "v1" means and its build
  order.
- `docs/environment-and-accounts.md` — every account/env var v1 needs.
- `docs/acceptance-criteria.md` — how to check the slice actually works.
- `docs/owner-decisions-needed.md` — decisions for Derrick before going
  further.
- `.claude/agents/` — the 13 specialist agent task contracts.
- `app/` — the actual running Next.js + Prisma application. See
  `app/README.md` to run it.
