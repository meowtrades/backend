import { FetchedData } from './mock.fetcher';

export interface TransformerOutput {
  timestamp: string; // or number
  value: number;
  [key: string]: any; // maybe more fields depending on strategy
}

/**
 * MockTransformer class is responsible for transforming fetched data points into a desired format.
 * It processes each data point and applies the transformation logic.
 */
export class MockTransformer {
  /**
   * Transforms the fetched data points into a desired format.
   * @param data - Fetched data points to be transformed
   * @returns TransformerOutput - The transformed data points suitable for graphing
   *
   * This method processes each data point and applies the transformation logic.
   * The transformation logic can include data formatting, aggregation, or any other necessary processing.
   * The data points are then returned in a format suitable for graphing for the frontend.
   */
  transform(data: FetchedData[]): TransformerOutput[] {
    // Example transformation logic
    return data.map(dataPoint => ({
      ...dataPoint,
      transformed: true, // Example transformation
    }));
  }
}
