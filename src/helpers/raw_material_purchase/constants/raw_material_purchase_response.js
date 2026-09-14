const { COMPANY_SELECT } = require("@helpers/company");
const { RAW_MATERIAL_SELECT } = require("@helpers/raw_material");

/**
 * The columns of the purchase itself that any endpoint may return.
 *
 * `material` and `supplier` are here because they are real reference fields and
 * both are populated. A populate path has to be in the projection or mongoose
 * has no id to follow.
 *
 * `payment` is an embedded list, not a reference, so it comes back whole. Every
 * column on a payment is returned, including `receipt_url`, because a client
 * showing what has been paid needs the link to the receipt beside the amount.
 *
 * `is_active` is here because a row that can be deactivated has to tell the
 * client which state it is in. `updated_at` is here so a client can tell whether
 * the copy it holds is the current one.
 *
 * `created_by` and `updated_by` are not. They are ids of staff accounts, and no
 * screen shows them today. Add them with a populate spec when one does, rather
 * than returning a bare id nobody can read.
 *
 * @type {string}
 */
const RAW_MATERIAL_PURCHASE_SELECT = [
  "material",
  "supplier",
  "purchase_date",
  "expected_delivery_date",
  "qty",
  "unit",
  "purchase_price",
  "gst_percentage",
  "gst_amount",
  "discount_amount",
  "discount_percentage",
  "final_payment_amount",
  "payment",
  "is_all_material_received",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * How every purchase response expands the two rows it points at.
 *
 * Both selects come from the feature that owns the row rather than being typed
 * here, so a material and a firm read the same whichever endpoint returned them.
 * If a purchase should show fewer columns of either, the narrower spec belongs
 * in that feature beside its own select, so every feature that expands one still
 * reads it from one place.
 *
 * There is no `match` on either. Both are to-one references, and a `match` on a
 * to-one replaces the document with null rather than dropping the row -- so a
 * purchase of a material that was deactivated after it was bought would arrive
 * claiming to be a purchase of nothing. Each row carries its own `is_active`,
 * which says the same thing honestly.
 */
const RAW_MATERIAL_PURCHASE_POPULATE = Object.freeze([
  Object.freeze({ path: "material", select: RAW_MATERIAL_SELECT }),
  Object.freeze({ path: "supplier", select: COMPANY_SELECT }),
]);

/**
 * The shape every purchase response is built from.
 *
 * Read through `get_response_shape(raw_material_purchase_response, "<action>")`.
 *
 * There is one shape and no variants. A purchase is read to see what was ordered
 * from whom, so the material and the firm are worth expanding wherever it
 * appears -- two bare ids would leave a client fetching both to show a name.
 */
const raw_material_purchase_response = Object.freeze({
  default: Object.freeze({
    select: RAW_MATERIAL_PURCHASE_SELECT,
    populate: RAW_MATERIAL_PURCHASE_POPULATE,
  }),
});

module.exports = {
  raw_material_purchase_response,
  RAW_MATERIAL_PURCHASE_SELECT,
};
