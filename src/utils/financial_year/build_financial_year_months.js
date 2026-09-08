const { financial_year } = require("@validators/constants");
const { in_ist } = require("@utils/financial_year/in_ist");

/**
 * The twelve buckets a financial year is drawn as, April first.
 *
 * Built from the window rather than read off the rows the database returned,
 * because a month nobody spent anything in has no row and still has to appear
 * on the chart -- a line that skips July reads as a July with no data rather
 * than a July with no spend.
 *
 * IST is a fixed offset all year, so adding months to a moment pinned to it
 * cannot drift across a daylight saving boundary the way a named zone could.
 *
 * @param   {Object} window             The value `get_financial_year` returned.
 * @param   {Date} window.start_date    The first instant of the year.
 * @returns {Array<{month_key: string, month_name: string,
 *                  month_number: number}>} Twelve entries in financial year
 *   order. `month_key` is the join key against `$dateToString` and is not meant
 *   to be returned to a client. `month_number` is the calendar month, so April
 *   is 4 -- the array is already in the right order, and a client wanting the
 *   calendar month should not have to convert a position back into one.
 */
const build_financial_year_months = ({ start_date }) => {
  const start = in_ist(start_date);

  return Array.from(
    { length: financial_year.MONTHS_IN_YEAR },
    (_value, offset) => {
      const month = start.clone().add(offset, "month");

      return {
        month_key: month.format(financial_year.MONTH_KEY_FORMAT),
        month_name: month.format(financial_year.MONTH_NAME_FORMAT),
        month_number: month.month() + 1,
      };
    },
  );
};

module.exports = { build_financial_year_months };
