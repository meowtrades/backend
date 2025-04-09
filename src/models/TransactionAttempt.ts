import mongoose, { Schema, Document, Types } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export interface ITransactionAttempt extends Document {
  _id: Types.ObjectId;
  planId: Types.ObjectId;
  userId: string;
  chain: string;
  amount: number;
  status: TransactionStatus;
  error?: string;
  txHash?: string;
  retryCount: number;
  maxRetries: number;
  lastAttemptTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionAttemptSchema: Schema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'InvestmentPlan', required: true },
    userId: { type: String, required: true },
    chain: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      required: true,
    },
    error: { type: String },
    txHash: { type: String },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastAttemptTime: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index to find pending and retrying transactions
TransactionAttemptSchema.index({ status: 1, lastAttemptTime: 1 });
// Index for finding transactions by plan
TransactionAttemptSchema.index({ planId: 1 });
// Index for finding transactions by user
TransactionAttemptSchema.index({ userId: 1 });

export const TransactionAttempt = mongoose.model<ITransactionAttempt>(
  'TransactionAttempt',
  TransactionAttemptSchema
);
