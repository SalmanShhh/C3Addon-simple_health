export const config = {
  returnType: "string",
  description: "Name of the status that fired the most recent status trigger.",
  highlight: false,
  deprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastStatus();
}
