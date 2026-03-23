export const config = {
  returnType: "number",
  description: "Damage absorption priority of the named pool. Lower numbers are consumed first. Returns 0 if the pool does not exist.",
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
  return this.getTempHealthPriority(type);
}
