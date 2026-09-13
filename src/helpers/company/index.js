/**
 * Everything the company feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/company")`.
 * Reaching past it into `constants/`, `db/` or `utils/` from outside this
 * folder is not allowed, so a file can move between them without breaking a
 * caller.
 *
 * constants/  the columns a company, an address and a contact answer with db/
 * the reference checks, and the transactional create and delete utils/
 * pure logic: duplicate key wording, nesting the created tree
 *
 * These live here because the company feature owns what a company is, including
 * which company types may supply us. `is_active_supplier_company_exists` is
 * called by the raw material controller rather than by a company one, and it
 * still lives here for that reason.
 *
 * If a third feature starts referencing companies, these lookups move to
 * `@helpers/common`; until then they stay with the entity they ask about.
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
  is_active_supplier_company_exists,
  deactivate_company_with_relations,
  deactivate_company_address_with_relations,
} = require("@helpers/company/db");
const {
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
  COMPANY_CONTACT_LIST_SELECT,
} = require("@helpers/company/constants");

module.exports = {
  build_company_tree,
  map_company_duplicate_error,
  run_with_company_duplicate_mapping,
  is_active_company_exists,
  find_active_company_address,
  create_company_with_relations,
  is_active_supplier_company_exists,
  deactivate_company_with_relations,
  deactivate_company_address_with_relations,
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
  COMPANY_CONTACT_LIST_SELECT,
};
