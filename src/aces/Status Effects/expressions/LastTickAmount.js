export const config = {
  returnType: "number",
  description: "Amount the most recent status tick tried to apply, before health pools and absorption.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastTickAmount();
}
