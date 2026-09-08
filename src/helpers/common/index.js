/**
 * Everything the common helpers offer, in one import.
 *
 * This is the only path other features use: `require("@helpers/common")`.
 * Reaching past it into `db/`, `utils/` or `constants/` from outside this folder
 * is not allowed, so a file can move between those three without breaking a
 * caller.
 *
 *   constants/  bases the money helpers are built on
 *   db/         reference checks any feature can run
 *   utils/      the response envelope, response shapes, retrying, money maths
 *
 * Something belongs here only when a second feature already needs it. Until
 * then it lives in the feature that uses it.
 */
const { is_active_user_exists } = require("@helpers/common/db");
const { PAISA_IN_RUPEE, PERCENT_BASE } = require("@helpers/common/constants");
const {
  to_paisa,
  retry_when,
  send_response,
  is_optional_integer,
  get_response_shape,
  expected_gst_amount,
  is_within_decimal_places,
} = require("@helpers/common/utils");

module.exports = {
  is_active_user_exists,
  PAISA_IN_RUPEE,
  PERCENT_BASE,
  to_paisa,
  retry_when,
  send_response,
  is_optional_integer,
  get_response_shape,
  expected_gst_amount,
  is_within_decimal_places,
};
