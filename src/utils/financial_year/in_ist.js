const moment = require("moment");

const { app_time } = require("@validators/constants");

/**
 * Reads an instant on the clock the business runs on.
 *
 * The instant itself is unchanged -- only which calendar day and month it is
 * being read as. That matters at the edges: 2am on 1 April in India is still
 * 31 March in UTC, so a row read in UTC would fall into the year that has just
 * ended.
 *
 * Folder-private: used by both financial year utils, and not re-exported by
 * `src/utils/financial_year/index.js`.
 *
 * @param   {Date|string|number} value  Any moment.
 * @returns {import("moment").Moment} The same moment, read as IST.
 */
const in_ist = (value) => moment(value).utcOffset(app_time.UTC_OFFSET);

module.exports = { in_ist };
