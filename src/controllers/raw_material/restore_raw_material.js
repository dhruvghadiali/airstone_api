const { raw_material_model } = require("@models/raw_material");
const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { raw_material_response } = require("@helpers/raw_material");
const { raw_material_messages } = require("@validators/messages");
const { send_response, get_response_shape } = require("@helpers/common");

/**
 * Restores a deactivated raw material by making it active again.
 *
 * The mirror of the delete. Where that one matches only active materials and
 * sets `is_active` false, this matches only deactivated ones and sets it true.
 * So restoring a material that is already live answers 404 rather than writing
 * a row nobody changed, which also stops a repeat call rewriting the
 * `updated_by` of a restore somebody else made.
 *
 * Nothing cascades here either. The delete left the material's purchases and
 * stock entries untouched, so there is nothing to bring back with it.
 *
 * This is why `is_active` is not a field the update endpoint accepts. Turning a
 * material off and on again is a decision worth its own route and its own
 * audit line, not a column a caller can set in passing while renaming it.
 *
 * `updated_by` is the signed in caller, so the row records who restored it.
 *
 * The reply carries the restored material rather than a bare message, because
 * there is no get endpoint yet and a client bringing a row back into a list has
 * nowhere else to read it from. Each supplier is expanded into the firm behind
 * it, as on every other raw material response.
 *
 * Only an admin may call this, enforced on the router rather than here.
 *
 * @route   PATCH /admin/raw-materials/:id/restore
 * @access  Admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.params
 * @param   {string} req.params.id  The material's id. 24 hex characters,
 *                                  validated by `raw_material_id_params_schema`.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the columns listed in
 *                          `raw_material_response`, each supplier expanded into
 *                          the company behind it.
 *
 * @throws  {app_error} 401 when the caller sent no usable token.
 * @throws  {app_error} 403 `ACCESS_FORBIDDEN` when the caller is not an admin.
 * @throws  {app_error} 404 `NOT_FOUND` when no deactivated material has that id
 *                      -- whether it never existed or is already active.
 */
const restore_raw_material = async (req, res) => {
  // `is_active: false` is in the filter, so a material that is already live is
  // simply not matched and reads as nothing to restore.
  const raw_material = await raw_material_model.findOneAndUpdate(
    { _id: req.params.id, is_active: false },
    { is_active: true, updated_by: req.user.id },
    { new: true, runValidators: true },
  );

  if (!raw_material) {
    throw new app_error(http_status.NOT_FOUND, raw_material_messages.NOT_FOUND);
  }

  const { select, populate } = get_response_shape(
    raw_material_response,
    "restore",
  );

  await raw_material.populate(populate);

  return send_response(
    res,
    http_status.OK,
    raw_material_messages.RESTORED,
    project(raw_material, select),
  );
};

module.exports = restore_raw_material;
