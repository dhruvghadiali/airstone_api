/**
 * What the single search box above the raw material table spans.
 *
 * Declared in full rather than left to fall back to `text_filters`, so the list
 * below is a decision a reader can see rather than an omission.
 *
 * `material_code` is in it, which is the opposite of the usual advice about
 * identifier columns. This table exists to find a material the yard already has
 * a code for, so a code copied off a bin label should find its row. The cost is
 * that one short term matches widely: `?search=01` lists every material with
 * `01` anywhere in its code as well as in its name. The company table takes the
 * same exception for GST and PAN numbers, and for the same reason.
 *
 * `unit` is not searched. Typing "kg" would list every material measured in
 * kilograms, which is a filter's job and is offered as one beside this.
 *
 * Nothing on a supplier is searched, so a firm's name typed into the box finds
 * nothing. Reaching it means a lookup in the companies collection per term, and
 * the box stays over the material's own columns until that is asked for.
 *
 * One term is tried against everything listed here at once, so the box widens
 * where a column filter narrows.
 */
const raw_material_search_config = Object.freeze({
  search_fields: Object.freeze(["material_name", "material_code"]),
});

module.exports = { raw_material_search_config };
