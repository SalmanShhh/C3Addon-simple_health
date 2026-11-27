export const config = {
  returnType: "number",
  description: "Number of health pools on this instance, including empty ones.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getPoolCount();
}
