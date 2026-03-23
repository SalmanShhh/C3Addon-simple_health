export const config = {
  returnType: "number",
  description: "Temporary health lost per second for a named pool (time-based decay rate).",
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
  return this.getTempHealthDecayRate(type);
}
