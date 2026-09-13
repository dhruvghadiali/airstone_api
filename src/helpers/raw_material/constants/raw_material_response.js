const { COMPANY_SELECT } = require("@helpers/company");

/**
 * The columns of the raw material itself that any endpoint may return.
 *
 * `supplier` is here because it is a real reference field and it is populated.
 * A populate path has to be in the projection or mongoose has no id to follow.
 *
 * `is_active` is here because a row that can be deactivated and restored has to
 * tell the client which state it is in. `updated_at` is here so a client can
 * tell whether the copy it holds is the current one.
 *
 * `created_by` and `updated_by` are not. They are ids of staff accounts, and no
 * screen shows them today. Add them with a populate spec when one does, rather
 * than returning a bare id nobody can read.
 *
 * @type {string}
 */
const RAW_MATERIAL_SELECT = [
  "material_name",
  "material_code",
  "unit",
  "supplier",
  "minimum_stock_level",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * How every raw material response expands the firms that supply it.
 *
 * The select comes from the company feature rather than being typed here, so a
 * firm reads the same whichever endpoint returned it. That is the company's
 * whole row. If a supplier should show fewer columns, the narrower spec belongs
 * in the company feature beside `COMPANY_SELECT`, so every feature that expands
 * a company still reads it from one place.
 *
 * There is no `match`. Hiding deactivated companies would make a supplier that
 * was deactivated after it was linked simply vanish from the list, and the
 * material would look like it has fewer suppliers than it has. `COMPANY_SELECT`
 * carries `is_active`, which says the same thing honestly.
 */
const RAW_MATERIAL_SUPPLIER_POPULATE = Object.freeze([
  Object.freeze({ path: "supplier", select: COMPANY_SELECT }),
]);

/**
 * The shape every raw material response is built from.
 *
 * Read through `get_response_shape(raw_material_response, "<action>")`.
 *
 * There is one shape and no variants. A raw material is a short row, and the
 * firms that supply it are worth reading wherever it appears -- a bare id would
 * leave a client fetching each company to show a name.
 */
const raw_material_response = Object.freeze({
  default: Object.freeze({
    select: RAW_MATERIAL_SELECT,
    populate: RAW_MATERIAL_SUPPLIER_POPULATE,
  }),
});

module.exports = { raw_material_response, RAW_MATERIAL_SELECT };
