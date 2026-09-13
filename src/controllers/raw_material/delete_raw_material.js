const { raw_material_model } = require("@models/raw_material");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { send_response } = require("@helpers/common");
const { raw_material_messages } = require("@validators/messages");

/**
 * Deletes a raw material by deactivating it.
 *
 * A delete here flips `is_active` to false rather than removing the row. The
 * material code carries a global unique index that is not scoped to active
 * rows, so a deactivated material keeps its code reserved and cannot be entered
 * again under the same one.
 *
 * Nothing cascades. The purchases and stock entries that name this material are
 * left exactly as they are, because they are records of what was bought and what
 * arrived, not rows filed under the material. Deactivating them would rewrite
 * history to tidy up a list. A purchase therefore goes on populating a material
 * that is no longer offered, which is the honest answer -- the same reason a
 * material's supplier list still shows a firm that was deactivated after it was
 * linked.
 *
 * So this endpoint means "stop offering this material for new work", not "erase
 * it". Whether a material with open purchase orders should be refused is a
 * separate rule, and one worth taking once those endpoints exist; today nothing
 * can create a purchase, so there is nothing to guard against.
 *
 * A material that is already deactivated answers 404. It reads as missing rather
 * than being deleted a second time, which also stops a repeat call rewriting the
 * `updated_by` of a deletion somebody else made.
 *
 * `updated_by` is the signed in caller, so the row records who deactivated it.
 *
 * Nothing is undone by this endpoint. There is no restore route, and the update
 * endpoint does not accept `is_active`, so bringing a material back is a
 * database job today. Worth knowing before this is put behind a delete button.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   DELETE /admin/raw-materials/:id
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The material's id. 24 hex characters,
 *                                  validated by `raw_material_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with a message and no payload, as every delete
 *                          here answers.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no active material has that id --
 *                      whether it never existed or was already deactivated.
 */
const delete_raw_material = async (req, res) => {
  // `is_active: true` is in the filter, so an already deactivated material is
  // simply not matched and reads as missing.
  const raw_material = await raw_material_model.findOneAndUpdate(
    { _id: req.params.id, is_active: true },
    { is_active: false, updated_by: req.user.id },
    { new: true, runValidators: true },
  );

  if (!raw_material) {
    throw new app_error(http_status.NOT_FOUND, raw_material_messages.NOT_FOUND);
  }

  return send_response(res, http_status.OK, raw_material_messages.DELETED);
};

module.exports = delete_raw_material;
