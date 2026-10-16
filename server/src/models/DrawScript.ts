import { Document, Schema, Types, model } from "mongoose";

export interface IDrawScript extends Document {
  group: Types.ObjectId;
  name: string;
  code: string;
  isDefault: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const drawScriptSchema = new Schema<IDrawScript>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "Player", required: true },
  },
  { timestamps: true },
);

export const DrawScript = model<IDrawScript>("DrawScript", drawScriptSchema);
