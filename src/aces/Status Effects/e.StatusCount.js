export const config = {
  returnType: "number",
  description: "Number of active statuses.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getStatusCount();
}
