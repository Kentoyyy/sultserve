Payments Service (FastAPI + PayMongo)

This is a small Python FastAPI service that integrates with PayMongo to create Checkout Sessions and handle webhooks.

Endpoints
- POST `/paymongo/checkout` — creates a Checkout Session for an order and returns `checkout_url` to redirect the customer.
- POST `/paymongo/webhook` — receives PayMongo webhook events and forwards payment status to the Next.js app.

Environment Variables
Copy `.env.example` to `.env` and fill with your keys:

```
PAYMONGO_SECRET_KEY=sk_test_xxx_or_live
PAYMONGO_PUBLIC_KEY=pk_test_xxx_or_live
PAYMONGO_WEBHOOK_SIGNING_SECRET=whsk_test_xxx
NEXT_INTERNAL_CONFIRM_URL=http://localhost:3000/api/payments/confirm
ALLOWED_ORIGINS=http://localhost:3000
SERVICE_PORT=8081
```

Run Locally
```bash
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8081 --reload
```

Notes
- Configure your PayMongo Dashboard webhook to point to: `http://localhost:8081/paymongo/webhook`
- In production, use HTTPS and update `NEXT_INTERNAL_CONFIRM_URL` to your deployed Next.js URL.

