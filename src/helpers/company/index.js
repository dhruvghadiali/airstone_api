/**
 * Everything the company feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/company")`.
 * Reaching past it into `db/` from outside this folder is not allowed, so a file
 * can move between folders without breaking a caller.
 *
 *   db/  the reference checks a company, address or contact write runs first
 *
 * These live here rather than in `@helpers/common` because only the company
 * controllers need them. If a second feature starts referencing companies,
 * `is_active_company_exists` moves to common; until then it stays with the
 * feature that uses it.
 */
const {
  is_active_company_exists,
  find_active_company_address,
} = require("@helpers/company/db");

module.exports = { is_active_company_exists, find_active_company_address };
