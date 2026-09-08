const moment = require("moment");

const { app_time, financial_year } = require("@validators/constants");

/**
 * IST midnight on 1 April of `year`, as the instant Mongo stores.
 *
 * `utcOffset(..., true)` keeps the wall clock and reinterprets it as IST rather
 * than shifting it, which is the same construction `parse_date_boundary` uses
 * for a plain date a caller typed. Written any other way, the year would turn
 * at the server's local midnight instead of India's.
 *
 * Folder-private: not re-exported by `src/utils/financial_year/index.js`. A
 * caller wanting the window asks `get_financial_year`, which returns both ends.
 *
 * @param   {number} year  The calendar year the financial year starts in, so
 *                         2026 means the 2026-2027 year.
 * @returns {import("moment").Moment} The first instant of that year.
 */
const financial_year_start = (year) =>
  moment
    .utc({ year, month: financial_year.START_MONTH_INDEX, day: 1 })
    .utcOffset(app_time.UTC_OFFSET, true)
    .startOf("day");

module.exports = { financial_year_start };
