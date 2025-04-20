import { MockTransformer, TransformerOutput } from './mock.transformer';
import { FetchedData } from './mock.fetcher';

describe('MockTransformer', () => {
  let transformer: MockTransformer;

  beforeEach(() => {
    transformer = new MockTransformer();
  });

  it('should transform fetched data correctly', () => {
    const mockData: FetchedData[] = [
      { timestamp: '2023-01-01', value: 100 },
      { timestamp: '2023-01-02', value: 200 },
    ];

    const expectedOutput: TransformerOutput[] = [
      { timestamp: '2023-01-01', value: 100, transformed: true },
      { timestamp: '2023-01-02', value: 200, transformed: true },
    ];

    const result = transformer.transform(mockData);

    expect(result).toEqual(expectedOutput);
  });
});
