"""Thin async client for the subset of Coolify's REST API this control plane wraps.

Coolify API docs: https://coolify.io/docs/api-reference/authorization
"""
import os

import httpx


class CoolifyError(RuntimeError):
    def __init__(self, status_code: int, detail: str):
        super().__init__(f"Coolify API error {status_code}: {detail}")
        self.status_code = status_code
        self.detail = detail


class CoolifyClient:
    def __init__(self, base_url: str | None = None, api_token: str | None = None):
        self.base_url = (base_url or os.environ["COOLIFY_URL"]).rstrip("/")
        self.api_token = api_token or os.environ["COOLIFY_API_TOKEN"]

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Accept": "application/json",
        }

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            response = await client.request(method, path, headers=self._headers(), **kwargs)
        if response.status_code >= 400:
            raise CoolifyError(response.status_code, response.text)
        if not response.content:
            return {}
        return response.json()

    async def list_applications(self) -> list[dict]:
        return await self._request("GET", "/api/v1/applications")

    async def get_application(self, uuid: str) -> dict:
        return await self._request("GET", f"/api/v1/applications/{uuid}")

    async def deploy_application(self, uuid: str) -> dict:
        return await self._request("GET", "/api/v1/deploy", params={"uuid": uuid})

    async def list_databases(self) -> list[dict]:
        return await self._request("GET", "/api/v1/databases")

    async def create_postgres_database(self, payload: dict) -> dict:
        return await self._request("POST", "/api/v1/databases/postgresql", json=payload)

    async def list_projects(self) -> list[dict]:
        return await self._request("GET", "/api/v1/projects")
