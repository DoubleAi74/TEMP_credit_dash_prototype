import { Balance } from "../models/Balance.mjs";
import { Card } from "../models/Card.mjs";
import { PaymentOrder } from "../models/PaymentOrder.mjs";
import { serializeBalance } from "../dashboard/serializeBalance.mjs";
import { connectToDatabase } from "./mongoose.mjs";

export async function initializeDatabaseIndexes() {
  await connectToDatabase();
  await Promise.all([Card.init(), Balance.init(), PaymentOrder.init()]);
}

export async function ensureSharedBalance() {
  await connectToDatabase();

  const balance = await Balance.findOneAndUpdate(
    { _id: "shared" },
    {
      $setOnInsert: {
        _id: "shared",
        amountMinor: 500,
        currency: "GBP",
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
    },
  ).lean();

  return serializeBalance(balance);
}
