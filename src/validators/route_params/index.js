/**
 * The barrel every route param schema is imported through.
 *
 * A new schema is added as
 * `src/validators/route_params/<entity>_id_params_validator.js` and re-exported
 * here, so a router imports one name from one place regardless of how many
 * entities exist.
 */
const company_id_params_schema = require("@validators/route_params/company_id_params_validator");
const company_contact_id_params_schema = require("@validators/route_params/company_contact_id_params_validator");
const company_address_id_params_schema = require("@validators/route_params/company_address_id_params_validator");

module.exports = {
  company_id_params_schema,
  company_contact_id_params_schema,
  company_address_id_params_schema,
};
