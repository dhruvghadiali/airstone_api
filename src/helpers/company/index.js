/**
 * Everything the company feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/company")`.
 * Reaching past it into `constants/`, `db/` or `utils/` from outside this folder
 * is not allowed, so a file can move between them without breaking a caller.
 *
 *   constants/  the columns a company, an address and a contact answer with
 *   db/         the reference checks, and the transactional create and delete
 *   utils/      pure logic: duplicate key wording, nesting the created tree
 *
 * These live here rather than in `@helpers/common` because only the company
 * controllers need them. If a second feature starts referencing companies,
 * `is_active_company_exists` moves to common; until then it stays with the
 * feature that uses it.
 */
const {
  build_company_tree,
  map_company_duplicate_error,
  run_with_company_duplicate_mapping,
} = require("@helpers/company/utils");
const {
  is_active_company_exists,
  find_active_company_address,
  create_company_with_relations,
  deactivate_company_with_relations,
} = require("@helpers/company/db");
const {
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
} = require("@helpers/company/constants");

module.exports = {
  build_company_tree,
  map_company_duplicate_error,
  run_with_company_duplicate_mapping,
  is_active_company_exists,
  find_active_company_address,
  create_company_with_relations,
  deactivate_company_with_relations,
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
};
