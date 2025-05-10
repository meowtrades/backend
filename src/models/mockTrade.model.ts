import { RiskLevel } from './../core/types/index';
import mongoose, { Document, Schema } from 'mongoose';
import { Frequency } from '../core/types';

export interface IMockTrade extends Document {
  userId: string; // Assuming user IDs are MongoDB ObjectIds
  strategyId: string; // Identifier for the chosen strategy
  tokenSymbol: string; // e.g., 'BTC', 'ETH'
  amount: number;
  initialAmount: number; // Initial investment amount, default $100
  initialInvestment: number; // Initial investment amount, default $100
  startDate: Date;
  endDate?: Date; // Nullable, set when the trade is stopped
  status: 'active' | 'stopped';
  frequency: Frequency;
  riskLevel: RiskLevel;
  // We might store calculated performance snapshots later, but start simple
}

const mockTradeSchema: Schema<IMockTrade> = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      default: 0, // Default to 0, can be updated later
    },
    userId: {
      type: String,
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
    initialAmount: {
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
    frequency: {
      type: String,
      enum: Object.values(Frequency),
      required: true,
      default: Frequency.DAILY, // Default to daily frequency
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      required: true,
      default: RiskLevel.LOW_RISK, // Default to low risk level
    },
    initialInvestment: {
      type: Number,
      required: true,
      default: 100, // Default to $100 as per requirements
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

export const MockTrade = mongoose.model<IMockTrade>('MockTrade', mockTradeSchema);
