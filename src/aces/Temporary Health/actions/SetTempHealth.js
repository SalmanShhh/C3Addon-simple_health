export const config = {
  listName: "Set health pool",
  displayText: "{my}: Set health pool {0} to {1}",
  description: "Set a named health pool to a specific amount.",
  isAsync: false,
  highlight: false,
  deprecated: false,
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
      desc: "The new pool health amount.",
      type: "number",
      initialValue: "50",
    },
  ],
};

export const expose = true;

export default function (type, amount) {
  this.setTempHealth(type, amount);
}
