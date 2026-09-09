const create_company = require("@controllers/company/create_company");
const update_company = require("@controllers/company/update_company");
const update_company_contact = require("@controllers/company/update_company_contact");
const update_company_address = require("@controllers/company/update_company_address");

module.exports = {
  create_company,
  update_company,
  update_company_contact,
  update_company_address,
};
