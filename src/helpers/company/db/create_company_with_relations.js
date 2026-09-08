const mongoose = require("mongoose");

const {
  company_model,
  company_contact_model,
  company_address_model,
} = require("@models/company");
const {
  run_with_company_duplicate_mapping,
} = require("@helpers/company/utils");

/**
 * Writes the three collections inside one transaction.
 *
 * Private to this file. `create_company_with_relations` below is the export; it
 * is this function with the duplicate key mapping wrapped around it. The two are
 * separate because the mapping has to sit outside the transaction: a clash
 * rewritten to an `app_error` inside the callback would be an error
 * `withTransaction` no longer recognises as a write failure.
 *
 * @param   {Object} details     A validated create body.
 * @param   {string} created_by  The signed in user's id.
 * @returns {Promise<Object>} `{ company, addresses, contacts }`.
 */
const write_company_tree = async (details, created_by) => {
  const { address: address_list, ...company_details } = details;

  const session = await mongoose.startSession();

  try {
    let written;

    await session.withTransaction(async () => {
      // `create` takes an array so the session can be passed as options; it
      // returns an array for the same reason, hence the destructure.
      const [company] = await company_model.create(
        [{ ...company_details, created_by }],
        { session },
      );

      const addresses = await company_address_model.create(
        address_list.map(({ contact_person, ...address }) => ({
          ...address,
          company: company._id,
          created_by,
        })),
        { session },
      );

      // Contacts are flattened across every address, and each one is tied to the
      // address at the same position. `create` preserves input order, which is
      // what makes the index line up with `address_list`.
      const contact_details = address_list.flatMap(
        ({ contact_person }, index) =>
          contact_person.map((contact) => ({
            ...contact,
            company: company._id,
            company_address: addresses[index]._id,
            created_by,
          })),
      );

      const contacts = await company_contact_model.create(contact_details, {
        session,
      });

      written = { company, addresses, contacts };
    });

    return written;
  } finally {
    await session.endSession();
  }
};

/**
 * Writes a company, its addresses and their contacts as one unit.
 *
 * The three collections are written inside a single transaction, so a company
 * either arrives complete or does not arrive at all. Without one, a contact that
 * fails validation would leave a company and an address behind that no endpoint
 * created deliberately and no caller asked for, and the caller would see a 400
 * for a company that now exists.
 *
 * The transaction lives here rather than in the controller because a controller
 * that owned a session could return before committing it, or throw between the
 * two. Keeping it in one function means the only ways out are commit and abort.
 *
 * `withTransaction` retries its callback when the server reports a transient
 * failure, so the callback assigns its result rather than returning it. A retry
 * runs the whole callback again from the start.
 *
 * This needs a replica set. A standalone `mongod` refuses to start a
 * transaction, which surfaces as a 500 on the first request rather than at boot.
 *
 * `created_by` is passed in rather than read from the body. It is who is signed
 * in, which is the server's fact, and `create_company_schema` refuses a
 * `created_by` field so the two guards meet in the middle.
 *
 * @param   {Object} details  A validated create body: the company's own fields,
 *                            plus `address`, each address carrying
 *                            `contact_person`.
 * @param   {string} created_by  The signed in user's id, from `req.user.id`.
 * @returns {Promise<{company: import("mongoose").Document,
 *                    addresses: import("mongoose").Document[],
 *                    contacts: import("mongoose").Document[]}>}
 *          The three sets of documents that were written, flat. Addresses come
 *          back in the order they were sent.
 *
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the GST or PAN number is
 *                      already on another company.
 * @throws  {Error} A Mongoose ValidationError when any of the three documents
 *                  fails its schema. Nothing is committed in that case.
 */
const create_company_with_relations = (details, created_by) =>
  run_with_company_duplicate_mapping(() =>
    write_company_tree(details, created_by),
  );

module.exports = { create_company_with_relations };
