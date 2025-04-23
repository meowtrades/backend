import { Frequency } from './../core/types/index';
import { Range } from '../core/types';
import { PythProviderInterval } from '../core/mocktrade/data-providers/pyth.provider';

export const rangeToDays = (range: Range): number => {
  switch (range) {
    case Range.ONE_WEEK:
      return 7;
    case Range.ONE_MONTH:
      return 30;
    case Range.THREE_MONTHS:
      return 90;
    case Range.ALL_TIME:
      return 365;
    default:
      throw new Error('Invalid range');
  }
};

export const frequencyToInterval = (frequency: Frequency): PythProviderInterval => {
  switch (frequency) {
    case Frequency.DAILY:
      return 'D';
    case Frequency.WEEKLY:
      return 'W';
    case Frequency.MONTHLY:
      return 'M';
    case Frequency.TEST_MINUTE:
      return '1'; // 1 minute
    default:
      throw new Error('Invalid frequency');
  }
};
