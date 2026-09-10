/**
 * The fixed value sets that no single feature owns.
 *
 * A GST slab is a GST slab whether a purchase or a sale carries it. A payment
 * type is the same list whether the money went to a supplier or came from a
 * customer. A vehicle is the same lorry whether it brings raw material in or
 * takes finished stone out. Each of these is one set, so it is written once. A
 * second copy is a copy that drifts.
 *
 * A set that only one feature will ever use does not belong here. It stays in
 * that feature's own enum file, the way `raw_material_unit_of_measure` stays
 * with the raw material.
 */

/**
 * The GST rates the government levies.
 *
 * The values are strings because a rate is a label on a bill and not a number to
 * do arithmetic on. `expected_gst_amount` converts with `Number()` when it needs
 * to calculate.
 *
 * `0` is a real slab, not a missing value. Some goods are exempt, and a bill for
 * one still has to say which slab it sits in.
 *
 * @type {Readonly<Object<string, string>>}
 */
const gst_slab = Object.freeze({
  ZERO: "0",
  FIVE: "5",
  TWELVE: "12",
  EIGHTEEN: "18",
  TWENTY_EIGHT: "28",
});

/**
 * How a bill was settled.
 *
 * `neft` and `rtgs` are kept apart rather than folded into one bank transfer,
 * because the two clear on different timetables and the accounts team
 * reconciles them separately.
 *
 * @type {Readonly<Object<string, string>>}
 */
const payment_type = Object.freeze({
  UPI: "upi",
  NEFT: "neft",
  RTGS: "rtgs",
  CASH: "cash",
  CHEQUE: "cheque",
});

/**
 * What kind of vehicle carried the load.
 *
 * The set describes how the load is carried, not who owns the lorry, because
 * that is what decides where it can unload and how long unloading takes.
 *
 * @type {Readonly<Object<string, string>>}
 */
const vehicle_type = Object.freeze({
  TRUCK: "truck",
  TIPPER: "tipper",
  PICKUP: "pickup",
  TRACTOR: "tractor",
  TRAILER: "trailer",
});

module.exports = { gst_slab, payment_type, vehicle_type };
