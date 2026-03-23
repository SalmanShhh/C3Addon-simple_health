export const config = {
  returnType: "number",
  description: "The amount of incoming damage intercepted by temporary health on the last hit.",
  highlight: false,
  deprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this.getLastTempDamageAbsorbed();
}
