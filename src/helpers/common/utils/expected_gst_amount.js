const { PERCENT_BASE } = require("@helpers/common/constants");

/**
 * Works out the GST hiding inside a GST inclusive total.
 *
 * A bill amount already has tax in it, so the taxable value is
 * `bill / (1 + pct/100)` and the tax is what is left -- which comes to
 * `bill * pct / (100 + pct)`. Multiplying the total by the rate outright would
 * overstate the tax on every bill.
 *
 * @param   {number|string} bill_amount      The tax inclusive total.
 * @param   {number|string} gst_percentage   The GST rate, as a percentage.
 * @returns {number} The tax inside that total.
 */
const expected_gst_amount = (bill_amount, gst_percentage) =>
  (Number(bill_amount) * Number(gst_percentage)) /
  (PERCENT_BASE + Number(gst_percentage));

module.exports = { expected_gst_amount };
