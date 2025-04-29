import mongoose, { Schema, Document } from 'mongoose';

export interface IMockDataBatch extends Document {
  mockId: string;
  batchId: string;
  data?: any;
}

const MockDataBatchSchema = new Schema<IMockDataBatch>({
  mockId: { type: String, required: true, unique: true },
  batchId: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
});

export const MockDataBatch = mongoose.model<IMockDataBatch>('MockDataBatch', MockDataBatchSchema);
