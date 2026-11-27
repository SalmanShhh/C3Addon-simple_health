export const config = {
  returnType: "number",
  description: "Deprecated: use PoolAbsorptionRate. Pool health lost per 1 point of incoming damage for a named pool. 1 = equal, 0.5 = armour-style.",
  highlight: false,
  isDeprecated: true,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool.",
      type: "string",
    },
  ],
};

export const expose = false;

export default function (type) {
  return this.getTempHealthAbsorptionRate(type);
}
