import mongoose, { Document, Schema } from 'mongoose';

export interface IMockTrade extends Document {
  userId: string; // Assuming user IDs are MongoDB ObjectIds
  strategyId: string; // Identifier for the chosen strategy
  tokenSymbol: string; // e.g., 'BTC', 'ETH'
  initialInvestment: number;
  startDate: Date;
  endDate?: Date; // Nullable, set when the trade is stopped
  status: 'active' | 'stopped';
  // We might store calculated performance snapshots later, but start simple
}

const mockTradeSchema: Schema<IMockTrade> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Link to the User model, adjust if your user model name is different
      required: true,
      index: true,
    },
    strategyId: {
      type: String,
      required: true,
    },
    tokenSymbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    initialInvestment: {
      type: Number,
      required: true,
      default: 100, // Default to $100 as per requirements
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'stopped'],
      default: 'active',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

export const MockTrade = mongoose.model<IMockTrade>('MockTrade', mockTradeSchema);
