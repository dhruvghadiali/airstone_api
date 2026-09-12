/**
 * The bounds one manufactured product line on a commercial product is held to.
 *
 * These are the line's own bounds, not the product's. A line says how many
 * units of one manufactured product go into one unit of the commercial product.
 *
 * `QTY_MIN` is 1. A line that contributes nothing is not a line. A manufactured
 * product that is not part of the bundle should be left off the list instead.
 *
 * `QTY_MAX` guards against a typed extra digit. Quantity is not held to whole
 * numbers, because a product sold by area or by length comes in fractions.
 *
 * How many lines a commercial product may carry is the product's own bound. So
 * `MANUFACTURED_PRODUCT_MIN_ITEMS` and `MANUFACTURED_PRODUCT_MAX_ITEMS` live in
 * `commercial_product_constants`, beside the field that holds the list.
 */
const commercial_product_manufactured_product_validation_limits =
  Object.freeze({
    QTY_MIN: 1,
    QTY_MAX: 1000000,
  });

module.exports = { commercial_product_manufactured_product_validation_limits };
