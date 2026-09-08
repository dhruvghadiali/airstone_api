const { http_status } = require("@enums");
const { send_response } = require("@helpers/common");
const { company_messages } = require("@validators/messages");
const {
  build_company_tree,
  create_company_with_relations,
} = require("@helpers/company");

/**
 * Creates a company, its addresses and the people at each address.
 *
 * The three arrive in one request rather than three, because a company with no
 * address and nobody to call is not yet usable. `create_company_schema` makes
 * both arrays required, and the write helper commits all three collections in
 * one transaction, so a company can never be left half entered.
 *
 * Only an admin may call this. That is enforced on the router by
 * `authenticate_user` followed by `authorize_user_types(ADMIN)`, not here, so
 * the rule is read in one place next to the address it guards.
 *
 * `created_by` is the signed in caller, taken from the token rather than from
 * the body. The schema refuses a `created_by` field, so there is no way for a
 * caller to record the company against somebody else.
 *
 * The reply mirrors the request -- the company, with `address` under it and
 * `contact_person` under each address -- so a client can render what it just
 * created without a second call. The ids are the only new part.
 *
 * @route   POST /admin/companies
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `create_company_schema`, which rejects
 *                            unknown fields.
 * @param   {string} req.body.company_name  Required. 2-150 chars, trimmed.
 * @param   {string} req.body.company_type  Required. One of supplier, customer,
 *                                          both.
 * @param   {string} req.body.email         Required. 5-254 chars, must be a
 *                                          valid email. Stored lower case.
 * @param   {string} req.body.phone_number  Required. Exactly 10 digits.
 * @param   {string} req.body.gst_number    Required. Exactly 15 chars, a valid
 *                                          GSTIN. Stored upper case. Unique.
 * @param   {string} req.body.pan_number    Required. Exactly 10 chars, five
 *                                          letters, four digits, one letter.
 *                                          Stored upper case. Unique.
 * @param   {Object[]} req.body.address     Required. At least one address.
 * @param   {string} req.body.address[].address  Required. 3-500 chars.
 * @param   {string} req.body.address[].pincode  Required. 6 digits, cannot
 *                                               start with zero.
 * @param   {Object[]} req.body.address[].contact_person  Required. At least one
 *                                                        contact per address.
 * @param   {string} req.body.address[].contact_person[].name  Required. 2-100
 *                                                             chars.
 * @param   {string} req.body.address[].contact_person[].phone_number  Required.
 *                                                        Exactly 10 digits.
 * @param   {string} req.body.address[].contact_person[].position  Required. One
 *                          of owner, manager, accounts, purchase, sales, other.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 201 with the company columns listed in
 *                          `company_response`, its addresses under `address`,
 *                          and each address's contacts under `contact_person`.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the GST or PAN number is
 *                      already on another company. The `errors` list names which
 *                      of the two clashed.
 */
const create_company = async (req, res) => {
  const { company, addresses, contacts } = await create_company_with_relations(
    req.body,
    req.user.id,
  );

  // The documents were written rather than fetched, so there was no query to
  // hang a projection on. They are narrowed and nested here instead of being
  // re-read purely to reshape data the process is already holding.
  return send_response(
    res,
    http_status.CREATED,
    company_messages.CREATED,
    build_company_tree(company, addresses, contacts),
  );
};

module.exports = create_company;
