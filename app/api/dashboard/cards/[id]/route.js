import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "../../../../../lib/db/mongoose.mjs";
import { Card } from "../../../../../lib/models/Card.mjs";

export async function DELETE(_request, context) {
  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  try {
    await connectToDatabase();
    const deletedCard = await Card.findByIdAndDelete(id).lean();

    if (!deletedCard) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove card." },
      { status: 500 },
    );
  }
}
