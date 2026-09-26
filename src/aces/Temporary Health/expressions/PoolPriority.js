export const config = {
  returnType: "number",
  description: "Absorption priority of a named pool. Lower numbers absorb first. 0 if the pool does not exist.",
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
  return this.getTempHealthPriority(type);
}
