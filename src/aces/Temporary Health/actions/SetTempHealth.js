export const config = {
  listName: "Set temp health",
  displayText: "Set {0} temp health to {1}",
  description: "Set a named temporary health pool to a specific value.",
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
      desc: "The new temporary health value.",
      type: "number",
      initialValue: "50",
    },
  ],
};

export const expose = true;

export default function (type, amount) {
  this.setTempHealth(type, amount);
}
