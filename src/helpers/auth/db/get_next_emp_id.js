const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { user_messages } = require("@validators/messages");
const { emp_id_generation } = require("@validators/constants");
const { build_emp_id_prefix, format_emp_id } = require("@helpers/auth/utils");
const {
  get_last_emp_id_sequence,
} = require("@helpers/auth/db/get_last_emp_id_sequence");

/**
 * Works out the next employee id to hand out.
 *
 * An employee id is `YYMM` plus a three digit counter, so `2609001` is the first
 * account of September 2026. The counter restarts at 001 whenever the year or
 * the month changes, read in Indian time.
 *
 * This reads the current highest counter and adds one, so two signups running at
 * the same instant can both get the same answer. That is expected: the unique
 * index rejects one of them, and the caller retries with a freshly read counter.
 * `is_emp_id_duplicate_error` is how a caller spots that case.
 *
 * @param   {Date|string|number} [reference_date=new Date()] Moment the id is
 *                                                           dated from.
 * @returns {Promise<string>} A seven character employee id.
 * @throws  {app_error} 409 `EMP_ID_SEQUENCE_EXHAUSTED` once the month has used
 *                      all 999 counters. Wrapping round would reuse an id.
 * @throws  {app_error} 500 `EMP_ID_GENERATION_FAILED` when a stored id is
 *                      malformed.
 */
const get_next_emp_id = async (reference_date = new Date()) => {
  const prefix = build_emp_id_prefix(reference_date);
  const next_sequence = (await get_last_emp_id_sequence(prefix)) + 1;

  if (next_sequence > emp_id_generation.SEQUENCE_MAX) {
    throw new app_error(
      http_status.CONFLICT,
      user_messages.EMP_ID_SEQUENCE_EXHAUSTED,
    );
  }

  return format_emp_id(prefix, next_sequence);
};

module.exports = { get_next_emp_id };
