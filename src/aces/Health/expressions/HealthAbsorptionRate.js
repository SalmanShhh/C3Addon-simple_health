export const config = {
  returnType: "number",
  description: "The current damage multiplier applied to real health. 1.0 = normal, 0.5 = resistance, 2.0 = vulnerability.",
  highlight: false,
  deprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this.getHealthAbsorptionRate();
}
