import { PriceData } from '../services/price.service';

export interface InputTransformer<T> {
  transform(dataPoints: T): PriceData[];
}
