const list_companies = require("@controllers/company/list_companies");
const create_company = require("@controllers/company/create_company");
const delete_company = require("@controllers/company/delete_company");
const update_company = require("@controllers/company/update_company");
const list_company_contacts = require("@controllers/company/list_company_contacts");
const delete_company_address = require("@controllers/company/delete_company_address");
const delete_company_contact = require("@controllers/company/delete_company_contact");
const update_company_contact = require("@controllers/company/update_company_contact");
const update_company_address = require("@controllers/company/update_company_address");

module.exports = {
  list_companies,
  create_company,
  delete_company,
  update_company,
  list_company_contacts,
  delete_company_address,
  delete_company_contact,
  update_company_contact,
  update_company_address,
};
