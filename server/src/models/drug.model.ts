import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { transformOptions } from './base';

export interface IDrug extends Document {
  id: string;
  name: string;
  form?: string | null;
  concentration?: string | null;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DrugSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true, unique: true, trim: true },
    form: { type: String, default: 'Tablet' },
    concentration: { type: String, default: null },
    dose: { type: String, default: null },
    frequency: { type: String, default: null },
    duration: { type: String, default: null },
    instructions: { type: String, default: null },
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: transformOptions, toObject: transformOptions },
);

export const Drug = mongoose.models.Drug || mongoose.model<IDrug>('Drug', DrugSchema);
