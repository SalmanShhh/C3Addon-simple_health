export const config = {
  returnType: "number",
  description: "Pool health lost per 1 point of incoming damage for a named pool. 1 = equal, 0.5 = armour-style.",
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool.",
      type: "string",
    },
  ],
};

export const expose = true;

export default function (type) {
  return this.getTempHealthAbsorptionRate(type);
}
