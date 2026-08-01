/**
 * Pure implementation of Bubble Sort for unit testing.
 * Decoupled from UI components and visualizer states.
 * 
 * @param {number[]} arr - The array of numbers to sort
 * @returns {number[]} A new sorted array
 */
export function bubbleSort(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('Input must be an array');
  }

  const sortedArray = [...arr];
  const n = sortedArray.length;

  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (sortedArray[j] > sortedArray[j + 1]) {
        // Swap
        let temp = sortedArray[j];
        sortedArray[j] = sortedArray[j + 1];
        sortedArray[j + 1] = temp;
        swapped = true;
      }
    }
    // Optimization: if no elements were swapped by inner loop, array is sorted
    if (!swapped) break;
  }

  return sortedArray;
}
