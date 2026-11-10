import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { transformOptions } from './base';

export interface IChatMessage extends Document {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'DOCTOR' | 'RECEPTION' | 'ADMIN';
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['DOCTOR', 'RECEPTION', 'ADMIN'],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: transformOptions, toObject: transformOptions }
);

ChatMessageSchema.index({ createdAt: -1 });

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

