import { PriceData } from '../../services/price.service';
import { InputTransformer } from '../../transformers/input.transformer.interface';
import { PythProviderData } from './pyth.provider';

export class PythTransformer implements InputTransformer<PythProviderData> {
  transform(data: PythProviderData): PriceData[] {
    const output = [];

    for (let i = 0; i < data.t.length; i++) {
      const dataPoint: PriceData = {
        date: new Date(data.t[i] * 1000).toISOString(),
        price: data.c[i],
        timestamp: data.t[i],
      };
      output.push(dataPoint);
    }

    return output;
  }
}
