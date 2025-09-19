import os
import hmac
import hashlib
import base64
from typing import Any, Dict

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

PAYMONGO_SECRET_KEY = os.getenv("PAYMONGO_SECRET_KEY", "")
PAYMONGO_PUBLIC_KEY = os.getenv("PAYMONGO_PUBLIC_KEY", "")
WEBHOOK_SECRET = os.getenv("PAYMONGO_WEBHOOK_SIGNING_SECRET", "")
NEXT_CONFIRM_URL = os.getenv("NEXT_INTERNAL_CONFIRM_URL", "http://localhost:3000/api/payments/confirm")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

if not PAYMONGO_SECRET_KEY:
    raise RuntimeError("PAYMONGO_SECRET_KEY is required")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LineItem(BaseModel):
    name: str
    amount: int
    currency: str = "PHP"
    quantity: int


class CheckoutRequest(BaseModel):
    order_id: str
    order_number: str
    line_items: list[LineItem]
    success_url: str
    cancel_url: str
    payment_method_types: list[str] = ["gcash", "card"]


def _basic_auth_header(secret_key: str) -> Dict[str, str]:
    # PayMongo uses Basic auth with the secret key as username
    token = base64.b64encode(f"{secret_key}:".encode()).decode()
    return {"Authorization": f"Basic {token}", "Content-Type": "application/json"}


@app.post("/paymongo/checkout")
async def create_checkout_session(payload: CheckoutRequest):
    data = {
        "data": {
            "attributes": {
                "description": f"Order {payload.order_number}",
                "line_items": [
                    {
                        "name": item.name,
                        "amount": item.amount,
                        "currency": item.currency,
                        "quantity": item.quantity,
                    }
                    for item in payload.line_items
                ],
                "payment_method_types": payload.payment_method_types,
                "success_url": payload.success_url,
                "cancel_url": payload.cancel_url,
                "metadata": {
                    "order_id": payload.order_id,
                    "order_number": payload.order_number,
                },
            }
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.paymongo.com/v1/checkout_sessions",
            json=data,
            headers=_basic_auth_header(PAYMONGO_SECRET_KEY),
        )
        if resp.status_code >= 400:
            # Bubble up PayMongo's error for easier debugging
            return {"ok": False, "status": resp.status_code, "error": resp.text}
        result = resp.json()
        checkout_url = result.get("data", {}).get("attributes", {}).get("checkout_url")
        return {"ok": True, "checkout_url": checkout_url, "raw": result}


def _verify_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    # PayMongo signature header is in the form: t=timestamp,v1=signature
    if not signature_header:
        return False
    parts = dict(kv.split("=") for kv in signature_header.split(","))
    signed_payload = f"{parts.get('t','')}.{raw_body.decode()}".encode()
    digest = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, parts.get("v1", ""))


@app.post("/paymongo/webhook")
async def paymongo_webhook(
    body: Dict[str, Any],
    paymongo_signature: str | None = Header(None, alias="Paymongo-Signature"),
):
    # Reconstruct raw body isn't trivial in FastAPI; reuse dict to string
    import json

    print(f"Webhook received: {json.dumps(body, indent=2)}")
    print(f"Signature: {paymongo_signature}")

    raw = json.dumps(body, separators=(",", ":")).encode()
    if WEBHOOK_SECRET and not _verify_signature(raw, paymongo_signature or "", WEBHOOK_SECRET):
        print("Invalid signature!")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = body.get("data", {}).get("attributes", {}).get("type") or body.get("type")
    data_attributes = body.get("data", {}).get("attributes", {})
    # Pull metadata from data.object or data.attributes.data?
    resource = data_attributes.get("data", {}) or data_attributes
    metadata = (
        resource.get("attributes", {}).get("metadata")
        if isinstance(resource, dict)
        else None
    )

    order_id = None
    if isinstance(metadata, dict):
        order_id = metadata.get("order_id")

    print(f"Event type: {event_type}")
    print(f"Order ID: {order_id}")
    print(f"Metadata: {metadata}")

    status_map = {
        "checkout_session.payment.paid": "paid",
        "payment.paid": "paid",
        "payment.failed": "failed",
        "refund.refunded": "refunded",
    }
    mapped = status_map.get(event_type, "unknown")

    print(f"Mapped status: {mapped}")

    if order_id:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                NEXT_CONFIRM_URL,
                json={
                    "orderId": order_id,
                    "eventType": event_type,
                    "paymentStatus": mapped,
                    "raw": body,
                },
            )
            print(f"Confirmation response: {response.status_code} - {response.text}")
    else:
        print("No order_id found, skipping confirmation")

    return {"ok": True}


