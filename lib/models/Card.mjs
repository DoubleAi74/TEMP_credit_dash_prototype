import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
      min: 0,
    },
    colour: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
  },
);

cardSchema.index({ createdAt: -1 });

export const Card =
  mongoose.models.Card ?? mongoose.model("Card", cardSchema, "dashboard_cards");
