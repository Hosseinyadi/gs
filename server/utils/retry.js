/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt),
        maxDelay
      );

      console.log(`⚠️  Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      console.log(`   Error: ${error.message}`);

      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with custom condition
 * @param {Function} fn - The async function to retry
 * @param {Function} shouldRetry - Function to determine if retry should happen
 * @param {Object} options - Retry options
 */
async function retryWithCondition(fn, shouldRetry, options = {}) {
  const { maxRetries = 3, delay = 1000 } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error;
      }
      
      console.log(`⚠️  Retry attempt ${attempt + 1}/${maxRetries}`);
      await sleep(delay);
    }
  }
}

module.exports = {
  retryWithBackoff,
  retryWithCondition,
  sleep
};
