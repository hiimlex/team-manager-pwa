import { Document, Schema, Types, model } from "mongoose";
import { nanoid } from "nanoid";

export interface IGroup extends Document {
  name: string;
  description?: string;
  emblem?: string;
  admin: Types.ObjectId;
  moderators: Types.ObjectId[];
  players: Types.ObjectId[];
  inviteCode: string;
  /** Supported match modes for this group */
  modes: ("quartet" | "doubles")[];
  adminPasswordHash?: string;
  defaultScript?: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    emblem: { type: String },
    admin: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    moderators: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    inviteCode: { type: String, default: () => nanoid(8), unique: true },
    modes: {
      type: [String],
      enum: ["quartet", "doubles"],
      default: ["quartet"],
    },
    adminPasswordHash: { type: String, select: false },
    defaultScript: { type: String },
  },
  { timestamps: true },
);

export const Group = model<IGroup>("Group", groupSchema);
