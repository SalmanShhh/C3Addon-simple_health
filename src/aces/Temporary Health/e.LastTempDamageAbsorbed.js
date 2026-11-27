export const config = {
  returnType: "number",
  description: "Deprecated: use LastPoolDamageAbsorbed. Incoming damage absorbed by the pool that fired the last pool trigger.",
  highlight: false,
  isDeprecated: true,
  params: [],
};

export const expose = false;

export default function () {
  return this.getLastTempDamageAbsorbed();
}
