const { money_precision } = require("@validators/constants/common");

/**
 * The bounds a raw material purchase is held to.
 *
 * `AMOUNT_MIN` and `AMOUNT_MAX` are one pair for every money column on the
 * purchase: the price, the GST, the discount and the final amount. All four are
 * the same thing -- an amount of rupees on this bill -- so they read one bound
 * rather than four copies that drift apart.
 *
 * Amounts are stored in rupees, not paise. `AMOUNT_DECIMAL_PLACES` is what keeps
 * that honest, and it reads `money_precision` so purchases, sales and supplier
 * credits cannot disagree about precision. Helpers still convert with `to_paisa`
 * before they compare two amounts, because adding floats does not land exactly.
 *
 * `DISCOUNT_PERCENTAGE_MAX` is 100. A discount larger than the bill is not a
 * discount, so this bound is unrelated to the amount bounds above and keeps its
 * own keys.
 *
 * `QTY_MAX` guards against a typed extra digit. Quantity is not held to whole
 * numbers, because half a tonne of sand is a real purchase.
 */
const raw_material_purchase_validation_limits = Object.freeze({
  QTY_MIN: 1,
  QTY_MAX: 1000000,
  AMOUNT_MIN: 0,
  AMOUNT_MAX: 1000000,
  AMOUNT_DECIMAL_PLACES: money_precision.AMOUNT_DECIMAL_PLACES,
  DISCOUNT_PERCENTAGE_MIN: 0,
  DISCOUNT_PERCENTAGE_MAX: 100,
});

module.exports = { raw_material_purchase_validation_limits };
