import { Document, Schema, Types, model } from "mongoose";

export interface IPlayerStats {
  setting: number;
  passing: number;
  attack: number;
  blocking: number;
  physical: number;
  technique: number;
  gameVision: number;
}

export interface IPlayerAffinity {
  player: Types.ObjectId;
  wins: number;
  total: number;
}

export interface IPlayer extends Document {
  name: string;
  nickname: string;
  photo?: string;
  age?: number;
  height?: number;
  gender: "M" | "F";
  position:
    | "setter"
    | "outside"
    | "middle"
    | "opposite"
    | "libero"
    | "universal";
  stats: IPlayerStats;
  overall: number;
  affinities: IPlayerAffinity[];
  groups: Types.ObjectId[];
  wins: number;
  losses: number;
  matchesPlayed: number;
  rachasPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

const statsSchema = new Schema<IPlayerStats>(
  {
    setting: { type: Number, min: 1, max: 10, default: 5 },
    passing: { type: Number, min: 1, max: 10, default: 5 },
    attack: { type: Number, min: 1, max: 10, default: 5 },
    blocking: { type: Number, min: 1, max: 10, default: 5 },
    physical: { type: Number, min: 1, max: 10, default: 5 },
    technique: { type: Number, min: 1, max: 10, default: 5 },
    gameVision: { type: Number, min: 1, max: 10, default: 5 },
  },
  { _id: false },
);

const affinitySchema = new Schema<IPlayerAffinity>(
  {
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    wins: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

const playerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    nickname: { type: String, required: true, trim: true },
    photo: { type: String },
    age: { type: Number, min: 10, max: 80 },
    height: { type: Number, min: 100, max: 250 },
    gender: { type: String, enum: ["M", "F"], required: true },
    position: {
      type: String,
      enum: ["setter", "outside", "middle", "opposite", "libero", "universal"],
      default: "universal",
    },
    stats: { type: statsSchema, default: () => ({}) },
    overall: { type: Number, default: 5 },
    affinities: { type: [affinitySchema], default: [] },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 },
    rachasPlayed: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Recalculate overall whenever stats change
playerSchema.pre("save", function (next) {
  const s = this.stats;
  this.overall =
    Math.round(
      (s.setting * 0.12 +
        s.passing * 0.15 +
        s.attack * 0.2 +
        s.blocking * 0.12 +
        s.physical * 0.18 +
        s.technique * 0.13 +
        s.gameVision * 0.1) *
        10,
    ) / 10;
  next();
});

export const Player = model<IPlayer>("Player", playerSchema);
