const moment = require("moment");

const { emp_id_generation } = require("@validators/constants");

/**
 * Builds the `YYMM` half of an employee id from a moment in time.
 *
 * The month is read in Indian time, so the prefix rolls over at Indian midnight
 * no matter where the server happens to run. Read in UTC, an account created at
 * 2am on the 1st would be filed under the month that has just ended.
 *
 * @param   {Date|string|number} [reference_date=new Date()] Moment to read.
 * @returns {string} Four characters, for example `2609` for September 2026.
 */
const build_emp_id_prefix = (reference_date = new Date()) => {
  const ist_moment = moment(reference_date).utcOffset(
    emp_id_generation.UTC_OFFSET,
  );

  return `${ist_moment.format(emp_id_generation.YEAR_FORMAT)}${ist_moment.format(
    emp_id_generation.MONTH_FORMAT,
  )}`;
};

module.exports = { build_emp_id_prefix };
