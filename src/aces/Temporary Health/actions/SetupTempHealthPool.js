export const config = {
  listName: "Setup temp health pool",
  displayText: "Setup {0} temp health | amount {1} | decay {2}s | absorption {3} | priority {4}",
  description: "Fully configure a named temporary health pool in one action — sets the amount, decay rate, absorption rate, and priority together.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool (e.g. \"shield\", \"armour\").",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "amount",
      name: "Amount",
      desc: "The temporary health value to set.",
      type: "number",
      initialValue: "50",
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
