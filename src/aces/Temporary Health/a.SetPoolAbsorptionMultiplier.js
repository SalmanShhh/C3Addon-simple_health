export const config = {
  listName: "Set health pool absorption multiplier",
  displayText: "{my}: Set health pool absorption multiplier to {0}",
  description: "Multiply every health pool's absorption rate without changing the rates themselves.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "multiplier",
      name: "Multiplier",
      desc: "1 = normal, 2 = pools drain twice as fast, 0.5 = half as fast, 0 = pools never deplete from damage.",
      type: "number",
      initialValue: "1",
    },
  ],
};

export const expose = true;

export default function (multiplier) {
  this.setPoolAbsorptionMultiplier(multiplier);
}
