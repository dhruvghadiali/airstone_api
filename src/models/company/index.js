/**
 * The company models, behind one import: `require("@models/company")`.
 *
 * Three collections rather than one document, because an address list and a
 * contact list both grow without limit and both are edited on their own. A
 * company embedding them would be rewritten whole every time a phone number
 * changed, and could not be paginated.
 *
 * Other folders import from this file. Files inside `src/models/company` import
 * each other directly, never through it.
 */
const company_model = require("@models/company/company_model");
const company_contact_model = require("@models/company/company_contact_model");
const company_address_model = require("@models/company/company_address_model");

module.exports = {
  company_model,
  company_contact_model,
  company_address_model,
};
