import { PriceData } from '../../services/price.service';

export interface Transformer<T> {
  transform(dataPoints: T): PriceData[];
}
