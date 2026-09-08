/**
 * Wraps whatever a controller returns in the one envelope this API answers with.
 *
 * `data` is always an array, even for a single document and even when there is
 * nothing to send. A client can then read `data[0]` or map over it without first
 * checking which shape it got, and adding a second row later does not change the
 * type a caller has already written code against.
 *
 * @param   {Object} data  Anything a controller wants to return.
 * @returns {Array} `data` as an array; an empty array for null or undefined.
 */
const normalize_response_data = (data) => {
  if (data === undefined || data === null) return [];

  return Array.isArray(data) ? data : [data];
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
 * @param   {*} [data=[]]                     Payload. Wrapped in an array.
 * @returns {import("express").Response} The response, already sent.
 */
const send_response = (res, status, message, data = []) =>
  res.status(status).json({
    status,
    data: normalize_response_data(data),
    message: String(message),
  });

module.exports = { send_response };
