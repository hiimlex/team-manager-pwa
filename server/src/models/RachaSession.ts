import { Document, Schema, Types, model } from "mongoose";

export interface IRachaSession extends Document {
  group: Types.ObjectId;
  date: Date;
  type: "quartet" | "doubles";
  players: Types.ObjectId[];
  matches: Types.ObjectId[];
  status: "active" | "finished";
  drawScript?: string;
  teams?: Types.ObjectId[][];
  createdAt: Date;
  updatedAt: Date;
}

const rachaSchema = new Schema<IRachaSession>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["quartet", "doubles"], required: true },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    matches: [{ type: Schema.Types.ObjectId, ref: "Match" }],
    status: { type: String, enum: ["active", "finished"], default: "active" },
    drawScript: { type: String },
    teams: [[{ type: Schema.Types.ObjectId, ref: "Player" }]],
  },
  { timestamps: true },
);

export const RachaSession = model<IRachaSession>("RachaSession", rachaSchema);
