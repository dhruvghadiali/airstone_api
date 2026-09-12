/**
 * The bounds one raw material line on a manufacturing product is held to.
 *
 * These are the line's own bounds, not the product's. A line says how much of
 * one material goes into one unit of the product.
 *
 * `QTY_MIN` is 1. A line that consumes nothing is not a line, and a material
 * that is not used should be left off the list instead.
 *
 * `QTY_MAX` guards against a typed extra digit. Quantity is not held to whole
 * numbers, because half a kilogram of a chemical is a real amount.
 *
 * How many lines a product may carry is the product's own bound, so
 * `RAW_MATERIAL_MIN_ITEMS` and `RAW_MATERIAL_MAX_ITEMS` live in
 * `manufacturing_product_constants` beside the field that holds the list.
 */
const manufacturing_product_raw_material_validation_limits = Object.freeze({
  QTY_MIN: 1,
  QTY_MAX: 1000000,
});

module.exports = { manufacturing_product_raw_material_validation_limits };
