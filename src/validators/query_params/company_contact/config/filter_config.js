const joi = require("joi");

const { contact_position } = require("@enums");
const {
  company_contact_validation_messages,
} = require("@validators/messages");

/**
 * What the contact table may be narrowed by.
 *
 * Every column here is the contact's own. The company and the address are
 * returned with each row, but neither is filterable: narrowing by one means
 * resolving it to a set of ids before the list query can start, and this table
 * answers "who is this person" rather than "who works at this firm". A company's
 * own people are already reachable through the company list, which returns them
 * nested.
 *
 * There is no `base_filter`. Every contact an admin may see is every contact
 * there is, so nothing here is a security boundary; the router decides who may
 * ask.
 *
 * `text_filters` are the per column boxes. Each is a case insensitive "contains"
 * and each narrows independently, so filling in two asks for rows matching both.
 * `phone_number` is one of them because an admin looking at a missed call has
 * the last few digits rather than all ten.
 *
 * `position` is an exact filter rather than a text one because it is an enum:
 * `?position=o` should not match owner and other at once.
 *
 * `is_active` defaults to true, so the table shows current people unless the
 * caller asks otherwise. A contact is deactivated on its own, and also whenever
 * the address or company above it is deleted, so `?is_active=false` is how the
 * ones that left are found.
 */
const company_contact_filter_config = Object.freeze({
  text_filters: Object.freeze(["name", "phone_number"]),
  exact_filters: Object.freeze({
    position: joi
      .string()
      .trim()
      .valid(...Object.values(contact_position))
      .messages({
        "string.base": company_contact_validation_messages.POSITION_BASE,
        "string.empty": company_contact_validation_messages.POSITION_EMPTY,
        "any.only": company_contact_validation_messages.POSITION_INVALID,
      }),
    is_active: joi.boolean().default(true).messages({
      "boolean.base": company_contact_validation_messages.IS_ACTIVE_BASE,
    }),
  }),
  date_filters: Object.freeze(["created_at"]),
});

module.exports = { company_contact_filter_config };
