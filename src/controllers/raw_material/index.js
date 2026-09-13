const list_raw_materials = require("@controllers/raw_material/list_raw_materials");
const create_raw_material = require("@controllers/raw_material/create_raw_material");
const delete_raw_material = require("@controllers/raw_material/delete_raw_material");
const update_raw_material = require("@controllers/raw_material/update_raw_material");
const restore_raw_material = require("@controllers/raw_material/restore_raw_material");

module.exports = {
  list_raw_materials,
  create_raw_material,
  delete_raw_material,
  update_raw_material,
  restore_raw_material,
};
