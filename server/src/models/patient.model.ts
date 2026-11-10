import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { transformOptions } from './base';

export interface IPatient extends Document {
  id: string;
  fileNumber?: string;
  fullName: string;
  searchName: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED';
  age?: number;
  dateOfBirth?: Date;
  address?: string;
  allergies: string[];
  chronicConditions: string[];
  generalNotes?: string;
  createdById: string;
  isArchived?: boolean;
  archivedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    fileNumber: { type: String, index: true },
    fullName: { type: String, required: true },
    searchName: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'], required: true },
    maritalStatus: {
      type: String,
      enum: ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'],
      default: 'MARRIED',
    },
    age: { type: Number },
    dateOfBirth: { type: Date },
    address: { type: String },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    generalNotes: { type: String },
    createdById: { type: String, required: true },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: transformOptions, toObject: transformOptions },
);

export const Patient = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
