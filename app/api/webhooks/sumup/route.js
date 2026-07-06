import { NextResponse } from "next/server";

import { connectToDatabase } from "../../../../lib/db/mongoose.mjs";
import { PaymentOrder } from "../../../../lib/models/PaymentOrder.mjs";
import { refreshPaymentOrderFromSumUp } from "../../../../lib/payments/payment-verification.mjs";
import { SumUpApiError } from "../../../../lib/payments/sumup-client.mjs";

function getWebhookCheckoutId(body) {
  return (
    body?.id ??
    body?.checkout_id ??
    body?.resource_id ??
    body?.payload?.id ??
    body?.checkout?.id ??
    null
  );
}

function getWebhookCheckoutReference(body) {
  return (
    body?.checkout_reference ??
    body?.payload?.checkout_reference ??
    body?.checkout?.checkout_reference ??
    null
  );
}

function safeWebhookErrorDetails(error) {
  if (error instanceof SumUpApiError) {
    return {
      kind: "sumup_api",
      status: error.status,
    };
  }

  return {
    kind: error?.name ?? "unknown_error",
  };
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  const checkoutId = getWebhookCheckoutId(body);
  const checkoutReference = getWebhookCheckoutReference(body);

  if (!checkoutId && !checkoutReference) {
    return NextResponse.json({ received: true });
  }

  try {
    await connectToDatabase();

    const query = checkoutId
      ? { sumupCheckoutId: checkoutId }
      : { sumupCheckoutReference: checkoutReference };
    const order = await PaymentOrder.findOne(query).lean();

    if (!order) {
      return NextResponse.json({ received: true });
    }

    await refreshPaymentOrderFromSumUp(order);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/webhooks/sumup error:", safeWebhookErrorDetails(error));

    return NextResponse.json({ received: true });
  }
}
