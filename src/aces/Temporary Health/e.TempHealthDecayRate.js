export const config = {
  returnType: "number",
  description: "Deprecated: use PoolDecayRate. Pool health lost per second for a named pool.",
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
  return this.getTempHealthDecayRate(type);
}
