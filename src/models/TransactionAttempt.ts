import mongoose, { Schema, Document, Types } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ITransactionAttempt extends Document {
  _id: Types.ObjectId;
  planId: Types.ObjectId;
  userId: string;
  type: 'buy' | 'sell' | 'swap';
  from: {
    token: string;
    amount: number;
  };
  to: {
    token: string;
    amount: number;
  };
  price: number;
  value: number;
  invested: number;
  status: TransactionStatus;
  error?: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionAttemptSchema: Schema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'InvestmentPlan', required: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ['buy', 'sell', 'swap'],
      required: true,
    },
    from: {
      token: { type: String, required: true },
      amount: { type: Number, required: true },
    },
    to: {
      token: { type: String, required: true },
      amount: { type: Number, required: true },
    },
    price: { type: Number, required: true },
    value: { type: Number, required: true },
    invested: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      required: true,
    },
    error: { type: String },
    txHash: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index to find pending transactions
TransactionAttemptSchema.index({ status: 1, createdAt: 1 });

export const TransactionAttempt = mongoose.model<ITransactionAttempt>(
  'TransactionAttempt',
  TransactionAttemptSchema
);
