/**
 * The bounds one manufacturing log is held to.
 *
 * A log is one batch of one product, so these are the bounds of the batch
 * itself. A material line's bounds live in their own file, beside the
 * sub-schema that both material lists share.
 *
 * `EXPECTED_QTY_MIN` is 1. A batch that sets out to make nothing is not a
 * batch. The floor is the only thing that separates this pair from the pair
 * below, so the two are kept apart rather than shared.
 *
 * `BATCH_QTY_MIN` is 0, and it covers the final and the damaged quantity. Both
 * are 0 while the batch is still running, and a batch that ends with nothing
 * usable really does finish at 0.
 *
 * Neither quantity is held to whole numbers, because a product measured by area
 * or by length comes off the line in fractions.
 *
 * `EXPECTED_QTY_MAX` and `BATCH_QTY_MAX` guard against a typed extra digit.
 * Neither is a real ceiling on what a plant can make in a day.
 *
 * `RAW_MATERIAL_MIN_ITEMS` is 1. A batch consumes at least one material, and
 * calling the array required without a floor would let an empty list through.
 *
 * `RAW_MATERIAL_WASTE_MAX_ITEMS` has no matching floor. A clean batch wastes
 * nothing, so an empty waste list is a normal batch and not a missing one.
 */
const manufacturing_log_validation_limits = Object.freeze({
  BATCH_QTY_MIN: 0,
  BATCH_QTY_MAX: 1000000,
  EXPECTED_QTY_MIN: 1,
  EXPECTED_QTY_MAX: 1000000,
  RAW_MATERIAL_MIN_ITEMS: 1,
  RAW_MATERIAL_MAX_ITEMS: 50,
  RAW_MATERIAL_WASTE_MAX_ITEMS: 50,
});

module.exports = { manufacturing_log_validation_limits };
