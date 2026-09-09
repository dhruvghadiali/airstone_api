const mongoose = require("mongoose");

const {
  company_contact_model,
  company_address_model,
} = require("@models/company");

/**
 * Deactivates one company address and the contacts who work at it.
 *
 * A delete in this project flips `is_active` rather than removing a row. A
 * branch that has closed takes the people at it with it: left behind, those
 * contacts would still be returned by every contact list, pointing at a place
 * nobody visits.
 *
 * The company is deliberately untouched. A company usually has more than one
 * address, and closing one branch says nothing about whether the firm is still
 * traded with. Deactivating the company from here would be this endpoint
 * deciding something it was not asked to decide.
 *
 * That does mean a company can end up with no active address, which the create
 * endpoint would not have allowed -- it requires at least one. Nothing stops it
 * today, and nothing reads it as an error.
 *
 * Both writes run inside a single transaction, so the address and its contacts
 * cannot disagree about whether the branch is open. They run one after another
 * rather than in a `Promise.all`, because a session carries one transaction and
 * will not accept concurrent operations on it.
 *
 * `is_active: true` is in both filters. It makes an already deactivated address
 * read as missing, so a second delete answers 404 rather than silently
 * succeeding, and it leaves contacts that were deactivated earlier on their own
 * with the `updated_by` of whoever did that.
 *
 * Contacts are matched on `company_address`, so only the people at this branch
 * are touched. The company's other branches keep theirs.
 *
 * This needs a replica set, like every transaction here. A standalone `mongod`
 * refuses to start one, which surfaces as a 500 on the first call.
 *
 * @param   {string} company_address_id  The address to deactivate.
 * @param   {string} updated_by  The signed in user's id, from `req.user.id`.
 * @returns {Promise<{company_address: import("mongoose").Document,
 *                    contacts: number}|null>}
 *          The deactivated address with how many contacts went with it, or null
 *          when no active address has that id -- which covers both an unknown id
 *          and one that was already deactivated. The caller cannot tell those
 *          two apart, and does not need to.
 */
const deactivate_company_address_with_relations = async (
  company_address_id,
  updated_by,
) => {
  const session = await mongoose.startSession();

  try {
    let deactivated;

    await session.withTransaction(async () => {
      const company_address = await company_address_model.findOneAndUpdate(
        { _id: company_address_id, is_active: true },
        { is_active: false, updated_by },
        { new: true, runValidators: true, session },
      );

      // Nothing to cascade to, and nothing to commit. The transaction closes
      // empty, which costs a round trip and keeps the one exit path.
      if (!company_address) {
        deactivated = null;
        return;
      }

      const contacts = await company_contact_model.updateMany(
        { company_address: company_address._id, is_active: true },
        { is_active: false, updated_by },
        { runValidators: true, session },
      );

      deactivated = {
        company_address,
        contacts: contacts.modifiedCount,
      };
    });

    return deactivated;
  } finally {
    await session.endSession();
  }
};

module.exports = { deactivate_company_address_with_relations };
