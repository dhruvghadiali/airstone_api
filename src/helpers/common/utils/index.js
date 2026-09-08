/**
 * Logic every feature can use: the response envelope, the response shape lookup,
 * retrying, and money arithmetic. Nothing in here reads or writes the database.
 *
 * Other folders import from this file. Files inside `src/helpers/common/utils`
 * import each other directly, never through this file.
 */
const { to_paisa } = require("@helpers/common/utils/to_paisa");
const { retry_when } = require("@helpers/common/utils/retry_when");
const { send_response } = require("@helpers/common/utils/send_response");
const {
  is_optional_integer,
} = require("@helpers/common/utils/is_optional_integer");
const {
  get_response_shape,
} = require("@helpers/common/utils/get_response_shape");
const {
  expected_gst_amount,
} = require("@helpers/common/utils/expected_gst_amount");
const {
  is_within_decimal_places,
} = require("@helpers/common/utils/is_within_decimal_places");

module.exports = {
  to_paisa,
  retry_when,
  send_response,
  is_optional_integer,
  get_response_shape,
  expected_gst_amount,
  is_within_decimal_places,
};
