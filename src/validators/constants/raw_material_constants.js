/**
 * The bounds and formats the raw materials collection is held to.
 *
 * `MATERIAL_NAME_MAX` is generous because a material is written down the way the
 * supplier's invoice spells it, grade and size included.
 *
 * `MATERIAL_CODE` is the short handle the yard uses. Uppercase letters, digits
 * and hyphens only. That way one material has one spelling, and two codes cannot
 * differ by a space alone.
 *
 * `MINIMUM_STOCK_LEVEL_MIN` is 1 and not 0. The field is the level at which the
 * material should be reordered, and a threshold of zero would only fire once the
 * yard had already run out.
 *
 * `MINIMUM_STOCK_LEVEL_MAX` guards against a typed extra digit. It is not a real
 * ceiling on how much stock a material can have.
 */
const raw_material_validation_limits = Object.freeze({
  MATERIAL_NAME_MIN: 2,
  MATERIAL_NAME_MAX: 200,
  MATERIAL_CODE_MIN: 2,
  MATERIAL_CODE_MAX: 50,
  MINIMUM_STOCK_LEVEL_MIN: 1,
  MINIMUM_STOCK_LEVEL_MAX: 1000000,
});

const raw_material_validation_patterns = Object.freeze({
  MATERIAL_CODE: /^[A-Z0-9-]+$/,
});

module.exports = {
  raw_material_validation_limits,
  raw_material_validation_patterns,
};
