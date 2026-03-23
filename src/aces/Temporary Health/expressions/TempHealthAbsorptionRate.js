export const config = {
  returnType: "number",
  description: "Temp health cost per 1 point of incoming damage for a named pool (absorption rate). 1.0 = equal, 0.5 = armour-style.",
  highlight: false,
  deprecated: false,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool.",
      type: "string",
    },
  ],
};

export const expose = false;

export default function (type) {
  return this.getTempHealthAbsorptionRate(type);
}
