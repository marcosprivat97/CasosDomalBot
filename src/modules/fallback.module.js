const logger = require('../logger');

/**
 * Executes a function with retry logic.
 * @param {Function} fn - The async function to execute.
 * @param {number} retries - Number of retries allowed.
 * @param {number} delay - Delay between retries in ms.
 * @param {string} taskName - Name of the task for logging.
 * @returns {Promise<*>} - The result of the function execution.
 */
async function withRetry(fn, retries = 3, delay = 5000, taskName = 'Task') {
    let attempt = 0;
    while (attempt <= retries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            logger.error(`[${taskName}] Attempt ${attempt} failed: ${error.message}`);
            if (attempt > retries) {
                logger.error(`[${taskName}] Max retries reached. Using fallback.`);
                throw error;
            }
            logger.info(`[${taskName}] Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = { withRetry };
