/**
 * The fixed value sets the raw material feature stores.
 *
 * `unit_of_measure` is how a raw material is counted when it is bought and when
 * its stock is read. One material has one unit, so a purchase made in another
 * unit is converted before it is recorded.
 *
 * The set covers the three ways this business measures stock: by weight, by
 * volume, and by count. `bag` is a count and not a weight, because a bag of
 * cement is bought and stored as a bag whatever it weighs.
 *
 * Values are stored lowercase, like every other enum here. A screen that shows
 * "Metric tonne" builds that label from the stored value.
 *
 * @type {Readonly<Object<string, string>>}
 */
const unit_of_measure = Object.freeze({
  BAG: "bag",
  GRAM: "gram",
  LITRE: "litre",
  PIECE: "piece",
  KILOGRAM: "kilogram",
  CUBIC_METER: "cubic_meter",
  METRIC_TONNE: "metric_tonne",
});

module.exports = { unit_of_measure };
