/**
 * Retry utility with exponential backoff
 */

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000);
      console.warn(`⚠️  Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = { retryWithBackoff };