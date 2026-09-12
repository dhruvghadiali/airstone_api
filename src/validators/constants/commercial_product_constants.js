const { money_precision } = require("@validators/constants/common");

/**
 * The bounds and formats a commercial product is held to.
 *
 * A commercial product is what the sales team sells. It is one or more
 * manufactured products priced and packed as a single sellable item.
 *
 * `PRODUCT_NAME_MAX` is generous, because a product is written down the way the
 * sales team spells it. That includes the grade and the size.
 *
 * `PRODUCT_CODE` is the short handle sales uses. Uppercase letters, digits and
 * hyphens only. That way one product has one spelling. Two codes cannot differ
 * by a space alone.
 *
 * `CLIENTS_MIN_ITEMS` is 0 and `CLIENTS_MAX_ITEMS` is 50. A product offered to
 * every client is not tied to any of them, so an empty list is a normal product
 * and not a missing one.
 *
 * The floor is written down so the Joi validator reads it rather than spelling
 * a 0 of its own. The model checks only the ceiling, because an array is never
 * shorter than nothing.
 *
 * `MANUFACTURED_PRODUCT_MIN_ITEMS` is 1. A commercial product is made of at
 * least one manufactured product. Calling the array required without a floor
 * would let an empty list through. `MANUFACTURED_PRODUCT_MAX_ITEMS` is 50,
 * which is well past any real bundle. It stops a runaway request storing a huge
 * document.
 *
 * `AMOUNT_MIN` and `AMOUNT_MAX` are one pair for every money column on the
 * product. That is the product price, the three costs, the selling price, the
 * discount and the GST. All seven are the same thing: an amount of rupees on
 * this product. So they read one bound rather than seven copies that drift
 * apart.
 *
 * `AMOUNT_MIN` is 0 and not 1. The zero GST slab is real, so a product in it
 * stores a GST amount of 0. A product with no packaging cost stores 0. A
 * product sold at list price stores a discount of 0.
 *
 * Amounts are stored in rupees, not paise. `AMOUNT_DECIMAL_PLACES` is what
 * keeps that honest. It reads `money_precision`, so products, purchases and
 * sales cannot disagree about precision. Helpers still convert with `to_paisa`
 * before they compare two amounts, because adding floats does not land exactly.
 */
const commercial_product_validation_limits = Object.freeze({
  AMOUNT_MIN: 0,
  AMOUNT_MAX: 1000000,
  PRODUCT_NAME_MIN: 2,
  PRODUCT_NAME_MAX: 200,
  PRODUCT_CODE_MIN: 2,
  PRODUCT_CODE_MAX: 50,
  CLIENTS_MIN_ITEMS: 0,
  CLIENTS_MAX_ITEMS: 50,
  MANUFACTURED_PRODUCT_MIN_ITEMS: 1,
  MANUFACTURED_PRODUCT_MAX_ITEMS: 50,
  AMOUNT_DECIMAL_PLACES: money_precision.AMOUNT_DECIMAL_PLACES,
});

const commercial_product_validation_patterns = Object.freeze({
  PRODUCT_CODE: /^[A-Z0-9-]+$/,
});

module.exports = {
  commercial_product_validation_limits,
  commercial_product_validation_patterns,
};
