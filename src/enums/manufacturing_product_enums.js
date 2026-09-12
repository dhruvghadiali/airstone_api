/**
 * The fixed value sets the manufacturing product feature stores.
 *
 * `manufacturing_product_unit_of_measure` is how a finished product is sold. It
 * is a different set from `raw_material_unit_of_measure`, because the two
 * measure different things. Raw material is bought by weight and volume.
 * Finished stone is sold by area, by length or by count.
 *
 * The set covers the three ways this business sells a product: by area, by
 * length, and by count. `box` and `set` are counts and not areas. A box of tile
 * is ordered as a box whatever area it covers.
 *
 * Values are stored lowercase, like every other enum here. A screen that shows
 * "Square feet" builds that label from the stored value.
 *
 * @type {Readonly<Object<string, string>>}
 */
const manufacturing_product_unit_of_measure = Object.freeze({
  BOX: "box",
  SET: "set",
  PIECE: "piece",
  SQUARE_FEET: "square_feet",
  SQUARE_METER: "square_meter",
  RUNNING_FEET: "running_feet",
});

module.exports = { manufacturing_product_unit_of_measure };
