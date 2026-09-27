export const config = {
  returnType: "number",
  description: "Incoming damage absorbed by the pool that fired the last pool trigger.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastTempDamageAbsorbed();
}
