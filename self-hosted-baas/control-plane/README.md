# Control plane

A small FastAPI wrapper around Coolify's REST API — the "Brain" from
`../docs/architecture.md`. Lets an AI agent (or you, via `curl`/the
auto-generated `/docs` page) issue plain requests like "deploy this
application" or "create a Postgres database" instead of hand-building
Coolify API calls each time.

## Run it

```bash
cp .env.example .env   # set COOLIFY_URL and COOLIFY_API_TOKEN
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Then open `http://localhost:8080/docs` for interactive API docs.

## Endpoints

| Method | Path | Does |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/projects` | List Coolify projects |
| GET | `/applications` | List applications |
| GET | `/applications/{uuid}` | Get one application |
| POST | `/applications/{uuid}/deploy` | Trigger a deploy for an existing application |
| GET | `/databases` | List databases |
| POST | `/databases` | Create a Postgres database |

## Deliberately not here yet

- **Creating applications from a git source.** That requires picking a git
  source, build pack, server, and domain — a deliberate, human-reviewed step
  best done once in the Coolify UI per app, not a single blind API call.
- **Delete/teardown endpoints.** Destructive actions (drop database, delete
  application) aren't exposed here per `../CLAUDE.md`'s governance rule:
  destructive infra changes need an explicit confirmation step, not a bare
  REST call an agent could fire without a human in the loop.
- **Auth on this API itself.** Right now this assumes it only runs on
  localhost or a trusted network. Add auth (API key, mTLS, whatever fits)
  before exposing it anywhere reachable by more than you.
