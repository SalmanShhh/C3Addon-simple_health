export const config = {
  listName: "Set temp health absorption rate",
  displayText: "Set {0} temp health absorption rate to {1}",
  description: "Set how much of a named pool is consumed per 1 point of incoming damage. 1.0 = equal, 0.5 = armour-style (1 dmg costs 0.5 armour), 2.0 = fragile shield.",
  isAsync: false,
  highlight: false,
  deprecated: true,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "rate",
      name: "Rate",
      desc: "Temp health cost per 1 point of damage (e.g. 0.5 = armour-style).",
      type: "number",
      initialValue: "1",
    },
  ],
};

export const expose = true;

export default function (type, rate) {
  this.setTempHealthAbsorptionRate(type, rate);
}
