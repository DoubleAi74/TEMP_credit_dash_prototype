import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { createRandomCardData } from "../../../../lib/dashboard/randomCard.mjs";
import { serializeBalance } from "../../../../lib/dashboard/serializeBalance.mjs";
import { serializeCard } from "../../../../lib/dashboard/serializeCard.mjs";
import { ensureSharedBalance } from "../../../../lib/db/bootstrap.mjs";
import { connectToDatabase } from "../../../../lib/db/mongoose.mjs";
import { Balance } from "../../../../lib/models/Balance.mjs";
import { Card } from "../../../../lib/models/Card.mjs";
import { FIRE_COST_MINOR } from "../../../../lib/money";

export async function POST() {
  await connectToDatabase();
  await ensureSharedBalance();

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const balance = await Balance.findOneAndUpdate(
        {
          _id: "shared",
          amountMinor: { $gte: FIRE_COST_MINOR },
        },
        {
          $inc: { amountMinor: -FIRE_COST_MINOR },
          $set: { updatedAt: new Date() },
        },
        {
          returnDocument: "after",
          session,
        },
      ).lean();

      if (!balance) {
        const currentBalance = await Balance.findById("shared")
          .session(session)
          .lean();

        result = {
          ok: false,
          balance: serializeBalance(currentBalance),
        };
        return;
      }

      const [card] = await Card.create([createRandomCardData()], { session });

      result = {
        ok: true,
        balance: serializeBalance(balance),
        card: serializeCard(card),
      };
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fire card." },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Balance too low.",
        balance: result.balance,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    balance: result.balance,
    card: result.card,
  });
}
