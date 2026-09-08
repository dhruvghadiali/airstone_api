const { project } = require("@utils/projection");
const { get_response_shape } = require("@helpers/common");
const {
  company_response,
  company_address_response,
  company_contact_response,
} = require("@helpers/company/constants");

/**
 * Nests freshly written addresses and contacts back under their company.
 *
 * The write helper returns three flat lists, because that is how the three
 * collections were written. A caller sent one nested company and should be
 * answered with one nested company, so the ids they now need are where they
 * expect them.
 *
 * The reply mirrors the request: `address` is the array of addresses, and each
 * address carries its own `contact_person`. Only the ids are new.
 *
 * Contacts are grouped by address id in one pass rather than by filtering the
 * list once per address, so a company with many addresses does not cost a scan
 * each.
 *
 * Pure -- no database and no request -- so it sits in `utils/` rather than
 * `db/`.
 *
 * @param   {import("mongoose").Document} company  The created company.
 * @param   {import("mongoose").Document[]} addresses  Its created addresses.
 * @param   {import("mongoose").Document[]} contacts   Every created contact,
 *                                                     across all addresses.
 * @returns {Object} The company, narrowed to the columns
 *                   `company_response` names, with `address` nested under it.
 *                   An address with no contacts gets an empty
 *                   `contact_person`, which today cannot happen -- the create
 *                   schema requires one -- but is what the shape says.
 */
const build_company_tree = (company, addresses, contacts) => {
  const { select: company_select } = get_response_shape(
    company_response,
    "create",
  );
  const { select: address_select } = get_response_shape(
    company_address_response,
    "create",
  );
  const { select: contact_select } = get_response_shape(
    company_contact_response,
    "create",
  );

  const contacts_by_address = new Map();

  for (const contact of contacts) {
    const address_id = String(contact.company_address);
    const group = contacts_by_address.get(address_id) || [];

    group.push(project(contact, contact_select));
    contacts_by_address.set(address_id, group);
  }

  return {
    ...project(company, company_select),
    address: addresses.map((address) => ({
      ...project(address, address_select),
      contact_person: contacts_by_address.get(String(address._id)) || [],
    })),
  };
};

module.exports = { build_company_tree };
