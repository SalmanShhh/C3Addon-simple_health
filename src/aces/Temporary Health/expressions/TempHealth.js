export const config = {
  returnType: "number",
  description: "Deprecated: use PoolHealth. Current health of a named pool.",
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

export const expose = true;

export default function (type) {
  return this.getTempHealth(type);
}
