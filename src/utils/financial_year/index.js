/**
 * The Indian financial year: which one a moment falls in, and the twelve months
 * it is drawn as.
 *
 * Other folders import from this file: `require("@utils/financial_year")`.
 * Files inside `src/utils/financial_year` import each other directly, never
 * through this file.
 *
 * `in_ist` and `financial_year_start` are deliberately not re-exported. They
 * are how the two functions below agree on where a day and a year begin, and
 * are of no use on their own.
 */
const {
  get_financial_year,
} = require("@utils/financial_year/get_financial_year");
const {
  build_financial_year_months,
} = require("@utils/financial_year/build_financial_year_months");

module.exports = { get_financial_year, build_financial_year_months };
