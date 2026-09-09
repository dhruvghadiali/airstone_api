const joi = require("joi");

const { company_type } = require("@enums");
const { company_validation_messages } = require("@validators/messages");

/**
 * What the company table may be narrowed by.
 *
 * Every column here is the company's own. An address or a contact is a row in
 * another collection, and filtering by one means resolving it to a set of
 * company ids first -- a lookup per parameter before the list query can even
 * start. The response carries the children so a reader can see them; narrowing
 * by them is a separate question, and not one this endpoint answers today.
 *
 * There is no `base_filter`. Every company an admin may see is every company
 * there is, so nothing here is a security boundary; what a caller may see is
 * decided by the router, which lets only an admin in.
 *
 * `text_filters` are the per column boxes in the table header. Each is a case
 * insensitive "contains" and each narrows independently, so filling in two of
 * them asks for rows matching both.
 *
 * `company_type` is an exact filter rather than a text one because it is an
 * enum: `?company_type=supp` should be a 400 naming the three values, not a
 * substring match that happens to work.
 *
 * `is_active` defaults to true, so the table shows live companies unless the
 * caller asks otherwise. It is a default in the schema rather than a
 * `base_filter` on purpose -- a deactivated company must stay reachable, since
 * `?is_active=false` is the only way to see one at all today.
 */
const company_filter_config = Object.freeze({
  text_filters: Object.freeze([
    "company_name",
    "email",
    "phone_number",
    "gst_number",
    "pan_number",
  ]),
  exact_filters: Object.freeze({
    company_type: joi
      .string()
      .trim()
      .valid(...Object.values(company_type))
      .messages({
        "string.base": company_validation_messages.COMPANY_TYPE_BASE,
        "string.empty": company_validation_messages.COMPANY_TYPE_EMPTY,
        "any.only": company_validation_messages.COMPANY_TYPE_INVALID,
      }),
    is_active: joi.boolean().default(true).messages({
      "boolean.base": company_validation_messages.IS_ACTIVE_BASE,
    }),
  }),
  date_filters: Object.freeze(["created_at"]),
});

module.exports = { company_filter_config };
