import { Document, Schema, Types, model } from "mongoose";

export interface ITeam {
  players: Types.ObjectId[];
  score: number;
}

export interface IMatch extends Document {
  rachaSession: Types.ObjectId;
  group: Types.ObjectId;
  date: Date;
  type: "quartet" | "doubles";
  teamA: ITeam;
  teamB: ITeam;
  winner?: "A" | "B";
  status: "ongoing" | "finished";
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    score: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const matchSchema = new Schema<IMatch>(
  {
    rachaSession: {
      type: Schema.Types.ObjectId,
      ref: "RachaSession",
      required: true,
    },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["quartet", "doubles"], required: true },
    teamA: { type: teamSchema, required: true },
    teamB: { type: teamSchema, required: true },
    winner: { type: String, enum: ["A", "B"] },
    status: { type: String, enum: ["ongoing", "finished"], default: "ongoing" },
    duration: { type: Number },
  },
  { timestamps: true },
);

export const Match = model<IMatch>("Match", matchSchema);
