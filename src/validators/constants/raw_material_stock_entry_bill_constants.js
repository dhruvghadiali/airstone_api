const { money_precision } = require("@validators/constants/common");

/**
 * The bounds one bill attached to a stock entry is held to.
 *
 * `BILL_AMOUNT_DECIMAL_PLACES` reads `money_precision` for the same reason the
 * purchase's amounts do: purchases, sales and the bills that arrive with a
 * consignment are not three separate decisions about precision.
 *
 * `FILE_URL_MIN` and `FILE_URL_MAX` bound a link to the scanned bill, not the
 * file itself. Nothing is stored in the database but the address.
 */
const raw_material_stock_entry_bill_validation_limits = Object.freeze({
  FILE_URL_MIN: 5,
  FILE_URL_MAX: 1000,
  BILL_AMOUNT_MIN: 0,
  BILL_NUMBER_MIN: 2,
  BILL_NUMBER_MAX: 100,
  BILL_AMOUNT_MAX: 1000000,
  BILL_AMOUNT_DECIMAL_PLACES: money_precision.AMOUNT_DECIMAL_PLACES,
});

module.exports = { raw_material_stock_entry_bill_validation_limits };
