/**
 * The fixed value sets a raw material stock entry stores.
 *
 * `qa_failure_reason` is why a consignment failed its quality test. It is only
 * about raw material arriving at the yard, so it stays with this feature rather
 * than going to `common_enums`.
 *
 * The set is short on purpose. It exists so the buyer can see what keeps going
 * wrong with a supplier, and a longer list of near-identical reasons would stop
 * being useful for that. `other` is for a failure that fits none of the five,
 * and `notes` on the entry carries the detail.
 *
 * There is no passing reason. Whether the test passed is `is_qa_test_pass`, and
 * a second field saying the same thing could disagree with it.
 *
 * @type {Readonly<Object<string, string>>}
 */
const qa_failure_reason = Object.freeze({
  OTHER: "other",
  DAMAGED: "damaged",
  MOISTURE: "moisture",
  WRONG_GRADE: "wrong_grade",
  CONTAMINATED: "contaminated",
  SHORT_QUANTITY: "short_quantity",
});

module.exports = { qa_failure_reason };
