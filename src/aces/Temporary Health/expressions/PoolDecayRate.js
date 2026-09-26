export const config = {
  returnType: "number",
  description: "Pool health lost per second for a named pool.",
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
  return this.getTempHealthDecayRate(type);
}
