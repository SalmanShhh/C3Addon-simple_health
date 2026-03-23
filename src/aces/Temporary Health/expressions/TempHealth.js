export const config = {
  returnType: "number",
  description: "Current temporary health of a named pool.",
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

export const expose = true;

export default function (type) {
  return this.getTempHealth(type);
}
