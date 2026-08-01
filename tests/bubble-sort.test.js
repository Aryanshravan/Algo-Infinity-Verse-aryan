import { bubbleSort } from '../modules/algorithms/bubble-sort.js';

describe('Bubble Sort Algorithm', () => {
  test('sorts a random array of integers', () => {
    const input = [5, 2, 9, 1, 5, 6];
    const expected = [1, 2, 5, 5, 6, 9];
    expect(bubbleSort(input)).toEqual(expected);
  });

  test('handles an already sorted array', () => {
    const input = [1, 2, 3, 4, 5];
    const expected = [1, 2, 3, 4, 5];
    expect(bubbleSort(input)).toEqual(expected);
  });

  test('handles an array in reverse order', () => {
    const input = [5, 4, 3, 2, 1];
    const expected = [1, 2, 3, 4, 5];
    expect(bubbleSort(input)).toEqual(expected);
  });

  test('handles an empty array', () => {
    expect(bubbleSort([])).toEqual([]);
  });

  test('handles an array with one element', () => {
    expect(bubbleSort([42])).toEqual([42]);
  });

  test('handles an array with negative numbers', () => {
    const input = [3, -1, -5, 2, 0];
    const expected = [-5, -1, 0, 2, 3];
    expect(bubbleSort(input)).toEqual(expected);
  });

  test('does not mutate the original array', () => {
    const input = [3, 1, 2];
    const originalInput = [...input];
    bubbleSort(input);
    expect(input).toEqual(originalInput);
  });

  test('throws an error if input is not an array', () => {
    expect(() => bubbleSort('not an array')).toThrow(TypeError);
  });
});
