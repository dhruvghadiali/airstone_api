/**
 * The columns of the company itself that any endpoint may return.
 *
 * `is_active` is here because a row that can be deactivated and restored has to
 * tell the client which state it is in.
 *
 * `updated_at` is here so a client can tell whether the copy it holds is the
 * current one.
 *
 * `created_by` and `updated_by` are not. They are ids of staff accounts, and no
 * screen shows them today. Add them with a populate spec when one does, rather
 * than returning a bare id nobody can read.
 *
 * @type {string}
 */
const COMPANY_SELECT = [
  "company_name",
  "company_type",
  "email",
  "phone_number",
  "gst_number",
  "pan_number",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The columns of one address.
 *
 * `company` is not here. An address is only ever returned inside the company it
 * belongs to, so the id would repeat what the reader already has.
 *
 * @type {string}
 */
const COMPANY_ADDRESS_SELECT = [
  "address",
  "pincode",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The columns of one contact.
 *
 * `company` and `company_address` are not here, for the reason `company` is left
 * off an address: a contact is returned inside the address it works at.
 *
 * @type {string}
 */
const COMPANY_CONTACT_SELECT = [
  "name",
  "phone_number",
  "position",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The shape every company response is built from.
 *
 * Read through `get_response_shape(company_response, "<action>")`. Only
 * `default` is declared, so every action falls back to it and one company reads
 * the same whichever endpoint returned it.
 *
 * `populate` is empty. A company references only the staff accounts that created
 * and updated it, and neither is returned.
 */
const company_response = Object.freeze({
  default: Object.freeze({
    select: COMPANY_SELECT,
    populate: Object.freeze([]),
  }),
});

/**
 * The shape every company address response is built from.
 *
 * Kept apart from `company_response` rather than made a variant of it, because
 * the two describe different things. A variant is one entity serialised two
 * ways; this is a second entity.
 */
const company_address_response = Object.freeze({
  default: Object.freeze({
    select: COMPANY_ADDRESS_SELECT,
    populate: Object.freeze([]),
  }),
});

/**
 * The shape every company contact response is built from. A third entity, so a
 * third config, for the reason given above.
 */
const company_contact_response = Object.freeze({
  default: Object.freeze({
    select: COMPANY_CONTACT_SELECT,
    populate: Object.freeze([]),
  }),
});

module.exports = {
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
};
