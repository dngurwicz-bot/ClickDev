"""External provider adapters for production notification/signature flows."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
from dataclasses import dataclass
from typing import Any, Dict

import httpx


@dataclass
class ProviderResponse:
    ok: bool
    status_code: int
    payload: Dict[str, Any]


class SendGridAdapter:
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY", "")

    async def send_email(self, to_email: str, subject: str, body: str) -> ProviderResponse:
        if not self.api_key:
            return ProviderResponse(ok=False, status_code=500, payload={"error": "SENDGRID_API_KEY missing"})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        data = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": os.getenv("SENDGRID_FROM_EMAIL", "no-reply@click.local")},
            "subject": subject,
            "content": [{"type": "text/plain", "value": body}],
        }
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post("https://api.sendgrid.com/v3/mail/send", headers=headers, json=data)
        return ProviderResponse(ok=response.status_code < 300, status_code=response.status_code, payload={"body": response.text[:1200]})


class TwilioAdapter:
    def __init__(self):
        self.sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.from_number = os.getenv("TWILIO_FROM_NUMBER", "")

    async def send_sms(self, to_number: str, body: str) -> ProviderResponse:
        if not self.sid or not self.token or not self.from_number:
            return ProviderResponse(ok=False, status_code=500, payload={"error": "Twilio credentials missing"})

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.sid}/Messages.json"
        data = {"To": to_number, "From": self.from_number, "Body": body}

        async with httpx.AsyncClient(timeout=10, auth=(self.sid, self.token)) as client:
            response = await client.post(url, data=data)
        parsed = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"raw": response.text[:1200]}
        return ProviderResponse(ok=response.status_code < 300, status_code=response.status_code, payload=parsed)


class FCMAdapter:
    def __init__(self):
        self.server_key = os.getenv("FCM_SERVER_KEY", "")

    async def send_push(self, token: str, title: str, body: str, data: Dict[str, Any] | None = None) -> ProviderResponse:
        if not self.server_key:
            return ProviderResponse(ok=False, status_code=500, payload={"error": "FCM_SERVER_KEY missing"})

        payload = {
            "to": token,
            "notification": {"title": title, "body": body},
            "data": data or {},
        }
        headers = {
            "Authorization": f"key={self.server_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post("https://fcm.googleapis.com/fcm/send", headers=headers, json=payload)
        parsed = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"raw": response.text[:1200]}
        return ProviderResponse(ok=response.status_code < 300, status_code=response.status_code, payload=parsed)


class DocuSignAdapter:
    def __init__(self):
        self.base_url = os.getenv("DOCUSIGN_BASE_URL", "https://demo.docusign.net/restapi")
        self.access_token = os.getenv("DOCUSIGN_ACCESS_TOKEN", "")
        self.account_id = os.getenv("DOCUSIGN_ACCOUNT_ID", "")
        self.webhook_secret = os.getenv("DOCUSIGN_WEBHOOK_SECRET", "")

    async def create_envelope(self, subject: str, email: str, name: str, document_base64: str, filename: str) -> ProviderResponse:
        if not self.access_token or not self.account_id:
            return ProviderResponse(ok=False, status_code=500, payload={"error": "DocuSign credentials missing"})

        url = f"{self.base_url}/v2.1/accounts/{self.account_id}/envelopes"
        payload = {
            "emailSubject": subject,
            "documents": [{"documentBase64": document_base64, "name": filename, "fileExtension": "pdf", "documentId": "1"}],
            "recipients": {"signers": [{"email": email, "name": name, "recipientId": "1", "routingOrder": "1", "tabs": {"signHereTabs": [{"anchorString": "/sn1/", "anchorUnits": "pixels", "anchorXOffset": "20", "anchorYOffset": "10"}]}}]},
            "status": "sent",
        }
        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, headers=headers, json=payload)
        parsed = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"raw": response.text[:1200]}
        return ProviderResponse(ok=response.status_code < 300, status_code=response.status_code, payload=parsed)

    def verify_webhook(self, raw_body: bytes, signature: str) -> bool:
        if not self.webhook_secret:
            return False
        digest = hmac.new(self.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, signature)


def safe_json_loads(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        return {"raw": text[:1200]}
