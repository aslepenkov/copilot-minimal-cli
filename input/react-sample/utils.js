// TODO: This file needs improvement
// It has some bugs and could be optimized

/**
 * Sorts an array of numbers using the bubble sort algorithm
 */
function bubbleSort(arr) {
  const n = arr.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  
  return arr;
}

/**
 * Find the maximum value in an array
 */
function findMax(arr) {
  if (arr.length === 0) return null;
  
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  
  return max;
}

// This function has a bug - it returns incorrect results for some inputs
function average(arr) {
  const sum = arr.reduce((acc, val) => acc + val);
  return sum / arr.length;
}

module.exports = {
  bubbleSort,
  findMax,
  average
};
