const _ = require("lodash");

const user_model = require("@models/user_model");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { user_messages } = require("@validators/messages");
const { emp_id_generation } = require("@validators/constants");

/**
 * Reads the highest counter already issued for one `YYMM` prefix.
 *
 * Sorting by `emp_id` as text is safe because every id sharing a prefix is the
 * same length, so text order and number order agree. That saves keeping a
 * separate counter document in step with the rows it counts.
 *
 * @param   {string} prefix  The `YYMM` half of the id, from `build_emp_id_prefix`.
 * @returns {Promise<number>} The highest counter used this month, or 0 when the
 *                            month has no accounts yet.
 * @throws  {app_error} 500 `EMP_ID_GENERATION_FAILED` when a stored id does not
 *                      end in a number. Failing loudly is the point: treating it
 *                      as 0 would restart the month and hand out an id that
 *                      already exists.
 */
const get_last_emp_id_sequence = async (prefix) => {
  const last_user = await user_model
    .findOne({ emp_id: new RegExp(`^${prefix}`) })
    .sort({ emp_id: -1 })
    .select("emp_id")
    .lean();

  if (_.isEmpty(last_user)) {
    return 0;
  }

  const sequence = _.toNumber(
    last_user.emp_id.slice(emp_id_generation.PREFIX_LENGTH),
  );

  if (!_.isInteger(sequence)) {
    throw new app_error(
      http_status.INTERNAL_SERVER_ERROR,
      user_messages.EMP_ID_GENERATION_FAILED,
    );
  }

  return sequence;
};

module.exports = { get_last_emp_id_sequence };
