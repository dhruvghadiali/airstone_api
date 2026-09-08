/**
 * Every message a caller can be shown, in one import.
 *
 * Wording lives here and nowhere else, so a message is never a string literal
 * in a controller, a model or a validator. Two shapes are exported per feature:
 * `<feature>_messages` for what an endpoint says when it succeeds or fails, and
 * `<feature>_validation_messages` for what one field says when it is wrong.
 *
 * `sort_field_message` is a function rather than a constant, because the
 * message has to name the columns the resource allows and those are only known
 * once a list config is in hand.
 *
 * Other folders import from this file. Files inside `src/validators/messages`
 * import each other directly, never through it.
 */
const { error_messages } = require("@validators/messages/error_message");
const {
  sort_field_message,
  list_query_validation_messages,
} = require("@validators/messages/list_query_message");
const {
  user_messages,
  user_validation_messages,
} = require("@validators/messages/user_message");

module.exports = {
  error_messages,
  sort_field_message,
  list_query_validation_messages,
  user_messages,
  user_validation_messages,
};
