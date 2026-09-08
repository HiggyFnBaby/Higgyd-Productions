"""FastAPI control plane — the "Brain" that wraps Coolify's API.

Exposes a small, agent-friendly surface instead of raw Coolify payloads.
Nothing here talks to real infrastructure unless COOLIFY_URL and
COOLIFY_API_TOKEN are set to a real, reachable Coolify instance.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.coolify_client import CoolifyClient, CoolifyError

app = FastAPI(
    title="Self-Hosted BaaS Control Plane",
    description="Agent-facing wrapper around Coolify's API.",
    version="0.1.0",
)


def get_client() -> CoolifyClient:
    return CoolifyClient()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/projects")
async def list_projects():
    try:
        return await get_client().list_projects()
    except CoolifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@app.get("/applications")
async def list_applications():
    try:
        return await get_client().list_applications()
    except CoolifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@app.get("/applications/{uuid}")
async def get_application(uuid: str):
    try:
        return await get_client().get_application(uuid)
    except CoolifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@app.post("/applications/{uuid}/deploy")
async def deploy_application(uuid: str):
    """Trigger a deployment for an existing application.

    Does not create applications — that requires choosing a git source,
    build pack, and server, which stays a deliberate, human-reviewed step
    via the Coolify UI for now rather than a one-call endpoint here.
    """
    try:
        return await get_client().deploy_application(uuid)
    except CoolifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@app.get("/databases")
async def list_databases():
    try:
        return await get_client().list_databases()
    except CoolifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class CreatePostgresDatabaseRequest(BaseModel):
    project_uuid: str
    server_uuid: str
    environment_name: str = "production"
    name: str
    enable_pgvector: bool = True


@app.post("/databases")
async def create_postgres_database(req: CreatePostgresDatabaseRequest):
    """Provision a new Postgres database via Coolify.

    `enable_pgvector` is recorded in the request but enabling the extension
    itself is a post-provision SQL step (`CREATE EXTENSION IF NOT EXISTS vector;`)
    run against the new database once Coolify reports it's up — Coolify's
    database-creation API does not take extension flags directly.
    """
    payload = {
        "project_uuid": req.project_uuid,
        "server_uuid": req.server_uuid,
        "environment_name": req.environment_name,
        "name": req.name,
    }
    try:
        return await get_client().create_postgres_database(payload)
    except CoolifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
