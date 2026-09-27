export const config = {
  listName: "Setup health pool",
  displayText: "{my}: Setup health pool {0}: amount {1}, decay {2}/s, absorption {3}, priority {4}",
  description: "Fully configure a health pool: amount, decay rate, absorption rate and priority.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool (e.g. \"shield\", \"armour\").",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "amount",
      name: "Amount",
      desc: "The pool health amount to set.",
      type: "number",
      initialValue: "50",
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
    {
      id: "priority",
      name: "Priority",
      desc: "Damage absorption priority. Lower numbers are consumed first. Default 0.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (type, amount, decayRate, absorptionRate, priority) {
  this.setupTempHealthPool(type, amount, decayRate, absorptionRate, priority);
}
