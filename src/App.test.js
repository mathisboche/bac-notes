import { calculateAverage } from './App';

describe('calculateAverage', () => {
  test('ignores blank entries and rounds to two decimals', () => {
    const values = [12.3456, '', null, undefined, 8];
    const result = calculateAverage(values);
    expect(result).toBe(10.17);
  });
});
