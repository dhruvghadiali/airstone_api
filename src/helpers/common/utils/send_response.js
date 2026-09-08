/**
 * Coerces whatever a controller returns into the object `data` always is.
 *
 * `data` is an object on every response, so a client reads `data.username`
 * without first checking whether it received an object, an array, or nothing.
 * Null and undefined become `{}` rather than being passed through, because
 * "nothing to return" and "a payload with no fields in it" are the same thing
 * to a caller and splitting them only gives clients a null check to forget.
 *
 * A bare array is refused rather than quietly wrapped. A collection belongs
 * under a name the caller can read -- `{ items, pagination }` for a list,
 * `{ errors }` for per-field failures -- and guessing which one was meant
 * would put a different key in the response depending on who called. Failing
 * here surfaces the mistake in development, where it costs nothing.
 *
 * @param   {*} data  Anything a controller wants to return.
 * @returns {Object} `data` as an object; `{}` for null or undefined.
 *
 * @throws  {TypeError} When `data` is an array or any other non-object value.
 */
const normalize_response_data = (data) => {
  if (data === undefined || data === null) return {};

  if (Array.isArray(data)) {
    throw new TypeError(
      "Response data must be an object; nest arrays under a key such as items or errors",
    );
  }

  if (typeof data !== "object") {
    throw new TypeError("Response data must be an object");
  }

  return data;
};

/**
 * Sends the single response shape every endpoint answers with, success or
 * failure: `{ status, data, message }`.
 *
 * The status code appears twice on purpose -- once as the HTTP status and once
 * in the body -- because a client reading the body alone (a log, a queued
 * webhook, a test fixture) still needs to know how the call went.
 *
 * @param   {import("express").Response} res  The response to write to.
 * @param   {number} status                   HTTP status, from `http_status`.
 * @param   {string} message                  Wording, from a message constant.
 * @param   {Object} [data={}]                Payload. Must be an object.
 * @returns {import("express").Response} The response, already sent.
 */
const send_response = (res, status, message, data = {}) =>
  res.status(status).json({
    status,
    data: normalize_response_data(data),
    message: String(message),
  });

module.exports = { send_response };
