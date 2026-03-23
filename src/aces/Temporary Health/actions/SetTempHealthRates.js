export const config = {
  listName: "Set temp health rates",
  displayText: "Set {0} temp health | decay {1}s | absorption {2}",
  description: "Set both the decay rate (HP lost per second) and absorption rate (temp HP cost per 1 damage) for a named pool in one action.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "decayRate",
      name: "Decay rate",
      desc: "Temporary health lost per second (0 = no decay).",
      type: "number",
      initialValue: "0",
    },
    {
      id: "absorptionRate",
      name: "Absorption rate",
      desc: "Temp health cost per 1 point of damage (1.0 = equal, 0.5 = armour-style).",
      type: "number",
      initialValue: "1",
    },
  ],
};

export const expose = true;

export default function (type, decayRate, absorptionRate) {
  this.setTempHealthRates(type, decayRate, absorptionRate);
}
