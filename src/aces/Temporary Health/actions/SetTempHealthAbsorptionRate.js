export const config = {
  listName: "Set health pool absorption rate",
  displayText: "{my}: Set health pool {0} absorption rate to {1}",
  description: "Set pool health lost per 1 damage. 1 = equal, 0.5 = armour-style, 2 = fragile.",
  isAsync: false,
  highlight: false,
  deprecated: true,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "rate",
      name: "Rate",
      desc: "Pool health lost per 1 point of damage (e.g. 0.5 = armour-style).",
      type: "number",
      initialValue: "1",
    },
  ],
};

export const expose = true;

export default function (type, rate) {
  this.setTempHealthAbsorptionRate(type, rate);
}
