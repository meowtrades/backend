import mongoose, { Schema, Document } from 'mongoose';
import { OpenAIStatus } from '../core/mocktrade/openai.batch.processor';

export interface IMockDataBatch extends Document {
  mockIds: string[]; // Array of mock trade IDs
  batchId: string; // Unique identifier for the batch by open ai
  tokenSymbol: string; // Token used for the mock trade
  strategyName: string; // Name of the strategy used for the mock trade
  status: string; // Status of the batch (e.g., 'active', 'stopped')
  data: any;
}

// Will store multiple mock ids, since each batch can be used for multiple mock trades
const MockDataBatchSchema = new Schema<IMockDataBatch>({
  mockIds: {
    type: [String],
    required: true,
  },
  batchId: {
    type: String,
    required: true,
  },
  tokenSymbol: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(OpenAIStatus),
    default: 'processing',
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
});

export const MockDataBatch = mongoose.model<IMockDataBatch>('MockDataBatch', MockDataBatchSchema);
