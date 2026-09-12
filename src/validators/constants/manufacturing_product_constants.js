const { money_precision } = require("@validators/constants/common");

/**
 * The bounds and formats a manufacturing product is held to.
 *
 * `PRODUCT_NAME_MAX` is generous because a product is written down the way the
 * sales team spells it, grade and size included.
 *
 * `PRODUCT_CODE` is the short handle the plant uses. Uppercase letters, digits
 * and hyphens only. That way one product has one spelling, and two codes cannot
 * differ by a space alone.
 *
 * `MEASUREMENT_VALUE_MIN` is 1, because a product that measures nothing cannot
 * be sold. `MEASUREMENT_VALUE_MAX` guards against a typed extra digit. The value
 * is not held to whole numbers, because half a square meter is a real size.
 *
 * `RAW_MATERIAL_MIN_ITEMS` is 1. A manufactured product is made of at least one
 * raw material, and calling the array required without a floor would let an
 * empty list through. `RAW_MATERIAL_MAX_ITEMS` is 50, which is well past any
 * real recipe and stops a runaway request storing a huge document.
 *
 * `AMOUNT_MIN` and `AMOUNT_MAX` are one pair for every money column on the
 * product: the manufacturing price, the selling price, the discount and the
 * GST. All four are the same thing -- an amount of rupees on this product -- so
 * they read one bound rather than four copies that drift apart.
 *
 * `AMOUNT_MIN` is 0 and not 1. The zero GST slab is real, so a product in it
 * stores a GST amount of 0. A product sold at list price stores a discount of 0.
 *
 * Amounts are stored in rupees, not paise. `AMOUNT_DECIMAL_PLACES` is what keeps
 * that honest, and it reads `money_precision` so products, purchases and sales
 * cannot disagree about precision. Helpers still convert with `to_paisa` before
 * they compare two amounts, because adding floats does not land exactly.
 */
const manufacturing_product_validation_limits = Object.freeze({
  AMOUNT_MIN: 0,
  AMOUNT_MAX: 1000000,
  PRODUCT_NAME_MIN: 2,
  PRODUCT_NAME_MAX: 200,
  PRODUCT_CODE_MIN: 2,
  PRODUCT_CODE_MAX: 50,
  MEASUREMENT_VALUE_MIN: 1,
  MEASUREMENT_VALUE_MAX: 1000000,
  RAW_MATERIAL_MIN_ITEMS: 1,
  RAW_MATERIAL_MAX_ITEMS: 50,
  AMOUNT_DECIMAL_PLACES: money_precision.AMOUNT_DECIMAL_PLACES,
});

const manufacturing_product_validation_patterns = Object.freeze({
  PRODUCT_CODE: /^[A-Z0-9-]+$/,
});

module.exports = {
  manufacturing_product_validation_limits,
  manufacturing_product_validation_patterns,
};
