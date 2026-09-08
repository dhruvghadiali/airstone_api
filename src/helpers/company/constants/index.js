/**
 * The company helper's constants, in one place.
 *
 * Other folders import from here. Files inside `src/helpers/company/constants`
 * import each other directly, never through this file.
 */
const {
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
} = require("@helpers/company/constants/company_response");

module.exports = {
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
};
