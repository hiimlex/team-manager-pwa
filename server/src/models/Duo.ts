import { Document, Schema, Types, model } from "mongoose";

export interface IDuo extends Document {
  group: Types.ObjectId;
  players: [Types.ObjectId, Types.ObjectId];
  name?: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const duoSchema = new Schema<IDuo>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    players: {
      type: [{ type: Schema.Types.ObjectId, ref: "Player" }],
      validate: {
        validator: (v: any[]) => v.length === 2,
        message: "Dupla deve ter exatamente 2 jogadores",
      },
      required: true,
    },
    name: { type: String, trim: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Prevent duplicate duos in the same group (order-independent)
duoSchema.index({ group: 1, players: 1 });

export const Duo = model<IDuo>("Duo", duoSchema);
