const { financial_year } = require("@validators/constants");
const { in_ist } = require("@utils/financial_year/in_ist");
const {
  financial_year_start,
} = require("@utils/financial_year/financial_year_start");

/**
 * The financial year a moment falls in.
 *
 * The Indian financial year runs 1 April to 31 March, so "this year" on a
 * dashboard means April onwards and not January onwards.
 *
 * Pure by construction: it takes a moment in time and returns the year that
 * moment falls in. It runs no query and reads no request, which is what keeps
 * it a util rather than a helper -- the code that *uses* the window to read the
 * database belongs in the dashboard feature's own `db/` folder.
 *
 * The year turns at IST midnight on 1 April wherever the process happens to be
 * running, the same rule the list date filters apply to a date a person typed.
 * A row recorded at 2am IST on 1 April belongs to the year that has just begun,
 * and would fall into the year that has just ended if the boundary were read in
 * UTC.
 *
 * `end_date` is the *next* year's 1 April rather than 31 March, so a range is
 * written `$gte: start_date, $lt: end_date` and needs no end-of-day arithmetic.
 * A row recorded at 11:59pm on 31 March is inside the year; one recorded a
 * minute later is not.
 *
 * @param   {Date|string|number} [reference]  The moment to read. Defaults to
 *                                            now, which is what every dashboard
 *                                            read wants; pass one so the
 *                                            boundary can be tested without
 *                                            waiting for April.
 * @returns {{start_year: number, end_year: number, label: string,
 *            start_date: Date, end_date: Date}} The year, and the window it
 *                                               covers.
 */
const get_financial_year = (reference) => {
  const ist_reference = in_ist(reference);

  // Before April the calendar year is one ahead of the financial year: January
  // 2027 is still the 2026-2027 year.
  const start_year =
    ist_reference.month() >= financial_year.START_MONTH_INDEX
      ? ist_reference.year()
      : ist_reference.year() - 1;

  const start = financial_year_start(start_year);
  const end = start.clone().add(1, "year");

  return {
    start_year,
    end_year: start_year + 1,
    label: `${start_year}${financial_year.LABEL_SEPARATOR}${start_year + 1}`,
    start_date: start.toDate(),
    end_date: end.toDate(),
  };
};

module.exports = { get_financial_year };
