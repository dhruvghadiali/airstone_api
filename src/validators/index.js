/**
 * The list of validator layers. Import a layer, not this file.
 *
 * Validation runs before a controller does, in `validate_request`, so a
 * controller never re-checks a shape, and never sees a value it was not
 * promised.
 * Each layer answers a different question about one request:
 *
 *   constants/      the limits and patterns every layer agrees on
 *   messages/       the wording a caller is shown
 *   request_body/   what a POST or PATCH body may contain
 *   route_params/   what a `:id` in the path may look like
 *   query_params/   what a list endpoint's query string may ask for
 *
 * Callers name the layer they want -- `require("@validators/messages")` --
 * rather than destructuring this file, so a route file pulls in the schemas and
 * not the whole validation tree. This exists so a reader sees the layers in one
 * place, matching `src/helpers/index.js` and `src/utils/index.js`.
 */
const constants = require("@validators/constants");
const messages = require("@validators/messages");
const request_body = require("@validators/request_body");
const route_params = require("@validators/route_params");
const query_params = require("@validators/query_params");

module.exports = {
  constants,
  messages,
  request_body,
  route_params,
  query_params,
};
