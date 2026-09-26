export const config = {
  returnType: "number",
  description: "Current health of a named pool.",
  highlight: false,
  deprecated: false,
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
