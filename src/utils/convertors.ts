import { Frequency } from './../core/types/index';
import { Range } from '../core/types';
import { PythProviderInterval } from '../core/mocktrade/data-providers/pyth.provider';

export const FREQUENCY_RANGE_MAP: Record<Frequency, { label: string; value: string }[]> = {
  [Frequency.TEST_10_SECONDS]: [
    { label: '5 Minutes', value: '5m' },
    { label: '15 Minutes', value: '15m' },
    { label: '30 Minutes', value: '30m' },
  ],
  [Frequency.TEST_MINUTE]: [
    { label: '1 Hour', value: '1h' },
    { label: '3 Hours', value: '3h' },
    { label: '6 Hours', value: '6h' },
    { label: '12 Hours', value: '12h' },
  ],
  [Frequency.DAILY]: [
    { label: '7 Days', value: '7d' },
    { label: '14 Days', value: '14d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '6 Months', value: '6M' },
    { label: '1 Year', value: '1y' },
  ],
  [Frequency.WEEKLY]: [
    { label: '1 Month', value: '1M' },
    { label: '3 Months', value: '3M' },
    { label: '6 Months', value: '6M' },
    { label: '1 Year', value: '1y' },
  ],
  [Frequency.MONTHLY]: [
    { label: '6 Months', value: '6M' },
    { label: '1 Year', value: '1y' },
    { label: '2 Years', value: '2y' },
    { label: '5 Years', value: '5y' },
  ],
};

/**
 *
 * @param range string
 * @returns number
 *
 * Converts a range string to a number of days.
 * The range string can be in the format of '7d', '14d', '30d', etc.
 * Can be looked up in the FREQUENCY_RANGE_MAP.
 */
export const rangeToDays = (range: string): number => {
  const match = range.match(/(\d+)([dMmy])/);
  if (!match) {
    throw new Error('Invalid range format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'd':
      return value;
    case 'm':
      return value * 30; // Approximate conversion
    case 'y':
      return value * 365; // Approximate conversion
    default:
      throw new Error('Invalid range unit');
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
