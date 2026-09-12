/**
 * The bounds one raw material line on a manufacturing log is held to.
 *
 * One sub-schema carries both lists on the log: what the batch consumed, and
 * what it wasted. The two hold the same three fields, so they read one set of
 * bounds.
 *
 * These are not the manufacturing product's recipe bounds, even though the
 * numbers match today. A recipe line says how much one unit of a product should
 * consume. A log line says how much a batch actually did consume. The two are
 * different facts and either bound can move without the other.
 *
 * `QTY_MIN` is 1. A line that records nothing is not a line, and a material that
 * was not used should be left off the list instead.
 *
 * `QTY_MAX` guards against a typed extra digit. Quantity is not held to whole
 * numbers, because half a kilogram of a chemical is a real amount.
 *
 * How many lines a log may carry is the log's own bound, so the item counts live
 * in `manufacturing_log_constants` beside the fields that hold the lists.
 */
const manufacturing_log_raw_material_validation_limits = Object.freeze({
  QTY_MIN: 1,
  QTY_MAX: 1000000,
});

module.exports = { manufacturing_log_raw_material_validation_limits };
