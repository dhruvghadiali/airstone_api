const mongoose = require("mongoose");

const {
  company_model,
  company_contact_model,
  company_address_model,
} = require("@models/company");

/**
 * Deactivates a company, its addresses and its contacts as one unit.
 *
 * A delete in this project flips `is_active` rather than removing a row, and a
 * company that is no longer traded with should take its branches and the people
 * at them with it. Left behind, those rows would still be returned by every
 * address and contact list, belonging to a company nobody can reach.
 *
 * All three collections are written inside a single transaction, so the tree
 * cannot be half deactivated. Without one, a failure after the company was
 * flipped would leave live addresses under a dead company, which no endpoint
 * would ever produce deliberately.
 *
 * The three writes run one after another rather than in a `Promise.all`. A
 * session carries one transaction and will not accept concurrent operations on
 * it, so parallel writes on the same session fail rather than run faster.
 *
 * `is_active: true` is in every filter. It makes an already deactivated company
 * read as missing, so a second delete answers 404 rather than silently
 * succeeding, and it stops the address and contact writes touching rows that
 * were deactivated on their own earlier. Those rows keep the `updated_by` of
 * whoever deactivated them, which is the honest record.
 *
 * Contacts are matched on their own `company`, not through their address. A
 * contact stores both, so one filter reaches every contact of the company
 * whether or not its address was still active.
 *
 * This needs a replica set, like every transaction here. A standalone `mongod`
 * refuses to start one, which surfaces as a 500 on the first call.
 *
 * @param   {string} company_id  The company to deactivate.
 * @param   {string} updated_by  The signed in user's id, from `req.user.id`.
 * @returns {Promise<{company: import("mongoose").Document,
 *                    addresses: number,
 *                    contacts: number}|null>}
 *          The deactivated company with how many addresses and contacts went
 *          with it, or null when no active company has that id -- which covers
 *          both an unknown id and one that was already deactivated. The caller
 *          cannot tell those two apart, and does not need to.
 */
const deactivate_company_with_relations = async (company_id, updated_by) => {
  const session = await mongoose.startSession();

  try {
    let deactivated;

    await session.withTransaction(async () => {
      const company = await company_model.findOneAndUpdate(
        { _id: company_id, is_active: true },
        { is_active: false, updated_by },
        { new: true, runValidators: true, session },
      );

      // Nothing to cascade to, and nothing to commit. The transaction closes
      // empty, which costs a round trip and keeps the one exit path.
      if (!company) {
        deactivated = null;
        return;
      }

      const addresses = await company_address_model.updateMany(
        { company: company._id, is_active: true },
        { is_active: false, updated_by },
        { runValidators: true, session },
      );

      const contacts = await company_contact_model.updateMany(
        { company: company._id, is_active: true },
        { is_active: false, updated_by },
        { runValidators: true, session },
      );

      deactivated = {
        company,
        addresses: addresses.modifiedCount,
        contacts: contacts.modifiedCount,
      };
    });

    return deactivated;
  } finally {
    await session.endSession();
  }
};

module.exports = { deactivate_company_with_relations };
