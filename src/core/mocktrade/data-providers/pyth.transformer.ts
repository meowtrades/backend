import { PriceData } from '../../services/price.service';
import { PythProviderData } from './pyth.provider';
import { Transformer } from './transformer.interface';

export class PythTransformer implements Transformer<PythProviderData> {
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
