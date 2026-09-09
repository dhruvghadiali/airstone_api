const {
  build_list_query_schema,
} = require("@validators/query_params/factory");
const {
  list_company_contacts_config,
} = require("@validators/query_params/company_contact/list_company_contacts_config");

const list_company_contacts_query_schema = build_list_query_schema(
  list_company_contacts_config,
);

module.exports = list_company_contacts_query_schema;
