/**
 * Runs an operation again while a caller supplied test recognises the thrown
 * error as worth retrying.
 *
 * Knows nothing about what it is retrying. The caller owns both the operation
 * and the decision about which failures repeat, so a server side clash can be
 * retried while a caller's mistake is returned straight away.
 *
 * An error the test rejects is rethrown at once. The last retryable error
 * escapes once the attempts run out, so the error handler still classifies it
 * normally rather than the caller seeing a made up "gave up" error.
 *
 * @param   {Function} should_retry   Given the error, returns true to try again.
 * @param   {number}   max_attempts   How many times to run the operation.
 * @param   {Function} operation      Receives the attempt number, starting at 1.
 * @returns {Promise<*>} Whatever the operation returned.
 * @throws  {Error} The first non-retryable error, or the last retryable one.
 */
const retry_when = async (should_retry, max_attempts, operation) => {
  let last_error;

  for (let attempt = 1; attempt <= max_attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (!should_retry(error)) {
        throw error;
      }

      last_error = error;
    }
  }

  throw last_error;
};

module.exports = { retry_when };
