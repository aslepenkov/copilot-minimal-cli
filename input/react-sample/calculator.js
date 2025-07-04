/**
 * A simple calculator function
 */
function add(a, b) {
  return a + b;
}

/**
 * Subtract two numbers
 */
function subtract(a, b) {
  return a - b;
}

/**
 * Multiply two numbers
 */
function multiply(a, b) {
  return a * b;
}

/**
 * Divide two numbers
 */
function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

// Export functions
module.exports = {
  add,
  subtract,
  multiply,
  divide
};
