import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m, required: true });

export const User = model('User', new Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
}));

export const Queue = model('Queue', new Schema({
  name: { type: String, required: true, trim: true },
  managerId: ref('User'),
  counter: { type: Number, default: 0 }, // last token number issued
}, { timestamps: true }));

// createdAt = joined queue. The other timestamps drive the analytics.
export const Token = model('Token', new Schema({
  queueId: ref('Queue'),
  managerId: ref('User'),
  personName: { type: String, required: true, trim: true },
  tokenNumber: Number,
  position: Number, // lower = closer to the front
  status: { type: String, enum: ['waiting', 'serving', 'completed', 'cancelled'], default: 'waiting' },
  servedAt: Date, completedAt: Date, cancelledAt: Date,
}, { timestamps: true }));
