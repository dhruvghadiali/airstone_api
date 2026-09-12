/**
 * The bounds one row of commercial product stock is held to.
 *
 * A row is a quantity of one commercial product that has been tested and
 * accepted into sellable stock. It names the batches it came off.
 *
 * `QTY_MIN` is 1. A stock row that holds nothing is not a row. A batch that
 * produced nothing usable should not be booked in at all.
 *
 * `QTY_MAX` guards against a typed extra digit. Quantity is not held to whole
 * numbers, because a product sold by area or by length comes off the line in
 * fractions.
 *
 * `MANUFACTURING_LOGS_MIN_ITEMS` is 1. Stock comes off batches, so a row names
 * at least one. Calling the array required without a floor would let an empty
 * list through.
 *
 * `MANUFACTURING_LOGS_MAX_ITEMS` is 1000. That is well past any real booking,
 * and it stops a runaway request storing a huge document. A thousand ObjectIds
 * is about 12 KB, so the row stays small.
 */
const commercial_product_stock_validation_limits = Object.freeze({
  QTY_MIN: 1,
  QTY_MAX: 1000000,
  MANUFACTURING_LOGS_MIN_ITEMS: 1,
  MANUFACTURING_LOGS_MAX_ITEMS: 1000,
});

module.exports = { commercial_product_stock_validation_limits };
