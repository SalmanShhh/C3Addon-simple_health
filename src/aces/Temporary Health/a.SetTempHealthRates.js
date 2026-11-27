export const config = {
  listName: "Set health pool rates",
  displayText: "{my}: Set health pool {0} rates: decay {1}/s, absorption {2}",
  description: "Set a health pool's decay rate and absorption rate in one action.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "decayRate",
      name: "Decay rate",
      desc: "Pool health lost per second (0 = no decay).",
      type: "number",
      initialValue: "0",
    },
    {
      id: "absorptionRate",
      name: "Absorption rate",
      desc: "Pool health lost per 1 point of damage (1.0 = equal, 0.5 = armour-style).",
      type: "number",
      initialValue: "1",
    },
  ],
};

export const expose = true;

export default function (type, decayRate, absorptionRate) {
  this.setTempHealthRates(type, decayRate, absorptionRate);
}
