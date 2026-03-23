export const config = {
  listName: "Add temp health",
  displayText: "Add {1} to {0} temp health",
  description: "Add to a named temporary health pool.",
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
      desc: "The amount of temporary health to add.",
      type: "number",
      initialValue: "50",
    },
  ],
};

export const expose = true;

export default function (type, amount) {
  this.addTempHealth(type, amount);
}
