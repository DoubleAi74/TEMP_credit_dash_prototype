# Operations Runbook — Credit Dashboard Prototype

This runbook is for the real-money-ready prototype. Keep secrets only in local
`.env.local` or Vercel environment variables.

## Sandbox vs Live Checklist

- Sandbox: `SUMUP_MODE=sandbox`, sandbox merchant code, sandbox secret server key,
  and sandbox/test cards only.
- Live: `SUMUP_MODE=live`, live merchant code, live secret server key, production
  HTTPS URLs, and `ENABLE_ADMIN_TOOLS=true` with strong Basic Auth credentials.
- Keep `ALLOW_TEMP_LIVE_PAYMENT_URLS=false` for production. Only set it to `true`
  for a deliberate, short live test through a temporary HTTPS tunnel.

## Deploy To Vercel

1. Create a new Vercel project from this prototype folder only.
2. Add production environment variables in Vercel. Do not paste values into code.
3. Set `APP_BASE_URL` to the production URL.
4. Set `SUMUP_CHECKOUT_RETURN_URL` to `https://your-domain/payment/return`.
5. Set `SUMUP_WEBHOOK_URL` to `https://your-domain/api/webhooks/sumup`.
6. Deploy and open `/admin/orders` to confirm Basic Auth protects admin tools.

## Verify Env Vars Without Printing Values

- Confirm presence by name in Vercel settings.
- Run `npm run build` locally with equivalent `.env.local` names.
- Never print `SUMUP_API_KEY_TEST`, `SUMUP_API_KEY_LIVE`, authorization headers,
  webhook raw bodies, or card data.

## Check A Payment Order

- Open `/admin/orders`.
- Confirm amount, local status, checkout status, credited flag, and paid timestamp.
- Use the Refresh action to retrieve the checkout from SumUp server-side.

## Refresh From SumUp

- Admin UI: `/admin/orders` → Refresh.
- API: `POST /api/admin/orders/:orderId/refresh`.
- This never credits from browser redirects. It credits only after authoritative
  SumUp retrieval verifies `PAID`.

## Inspect Webhooks

- Open `/admin/webhooks`.
- `UNKNOWN_CHECKOUT` means SumUp sent an identifier the app cannot match.
- `CHECKOUT_NOT_PAID` means the checkout was matched but not paid.
- `VERIFICATION_MISMATCH` means a paid checkout failed id/reference/merchant/
  currency/amount verification and must be investigated.

## Refund

- Use `/admin/orders` → Refund for a paid, credited order with a transaction id.
- Full refund defaults to the order amount; partial refunds can be entered in GBP.
- The app records the SumUp refund result and creates a negative ledger adjustment
  only if the current credit balance can cover it.
- If a refund succeeds but local credits cannot be deducted safely, the refund is
  marked for manual review and the balance is not driven negative.

## Reconcile Balance And Ledger

- Run `npm run ledger:repair` once after deploying the ledger to create historical
  `TOP_UP` entries for already credited paid orders. It does not change balance.
- Run `npm run payment:audit` to see safe counts for stale pending orders,
  uncredited paid orders, missing ledger rows, webhook mismatches, and unknown
  webhooks.
- Every new balance movement should have one `credit_ledger` row.

## Rotate SumUp Keys

1. Create a new server secret key in the matching SumUp mode.
2. Add it to Vercel as `SUMUP_API_KEY_LIVE` for live mode or
   `SUMUP_API_KEY_TEST` for sandbox mode.
3. Redeploy.
4. Confirm checkout creation works.
5. Revoke the old key in SumUp.

## Do Not Log

- SumUp secret keys.
- Authorization headers.
- Raw webhook bodies that may include sensitive provider data.
- Hosted checkout URLs in long-lived logs.
- Card data.

## Stuck Paid / Uncredited Payment

1. Open `/admin/orders`.
2. Find the order and click Refresh.
3. If it stays uncredited, run `npm run payment:audit`.
4. Check `/admin/webhooks` for mismatches or unknown checkout identifiers.
5. Do not manually edit balance without creating a `MANUAL_ADJUSTMENT` ledger row.

## Real-Money Launch Checklist

- [ ] `SUMUP_MODE=live`.
- [ ] Live merchant code and live server secret key configured.
- [ ] Production HTTPS return and webhook URLs configured.
- [ ] Admin tools enabled and protected by strong credentials.
- [ ] `npm run lint`, `npm run test`, and `npm run build` pass.
- [ ] `npm run ledger:repair` has been run after migration.
- [ ] `npm run payment:audit` returns zero critical counts.
- [ ] A tiny live payment has been tested and reconciled.
