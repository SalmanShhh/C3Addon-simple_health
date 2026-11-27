export const config = {
  returnType: "number",
  description: "Multiplier currently applied to every pool's absorption rate: the global multiplier times every active status's.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getPoolAbsorptionMultiplier();
}
