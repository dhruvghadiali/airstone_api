/**
 * The bounds one raw material stock entry is held to.
 *
 * A stock entry is one consignment arriving on one vehicle, so these are the
 * bounds of the consignment itself. The vehicle's bounds and a bill's bounds
 * live in their own files, beside their own sub-schemas.
 *
 * `PURCHASE_ORDERS_MIN_ITEMS` is 1. A consignment arrives against at least one
 * order, and calling the array required without a floor would let an empty list
 * through.
 *
 * `QR_CODE_MIN` is 10 because a code shorter than that is almost always a
 * partial scan. A consignment that arrives without a code stores null, which
 * this bound does not apply to.
 *
 * `QTY_MAX` guards against a typed extra digit. Quantity is not held to whole
 * numbers, because half a tonne of sand is a real consignment.
 */
const raw_material_stock_entry_validation_limits = Object.freeze({
  QTY_MIN: 1,
  QTY_MAX: 1000000,
  NOTES_MIN: 2,
  NOTES_MAX: 1000,
  QR_CODE_MIN: 10,
  QR_CODE_MAX: 1000,
  PURCHASE_ORDERS_MIN_ITEMS: 1,
});

module.exports = { raw_material_stock_entry_validation_limits };
