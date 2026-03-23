export const config = {
  listName: "Set health absorption rate",
  displayText: "Set health absorption rate to {0}",
  description: "Set the multiplier applied to damage that reaches real health. 1.0 = normal, 0.5 = 50% damage taken (resistance), 2.0 = double damage taken (vulnerability), 0 = immune.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [
    {
      id: "rate",
      name: "Rate",
      desc: "Damage multiplier for real health (e.g. 0.5 = half damage taken, 2.0 = double damage taken).",
      type: "number",
      initialValue: "1",
    },
  ],
};

export const expose = true;

export default function (rate) {
  this.setHealthAbsorptionRate(rate);
}
