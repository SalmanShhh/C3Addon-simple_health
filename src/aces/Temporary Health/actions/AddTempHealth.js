export const config = {
  listName: "Add to health pool",
  displayText: "{my}: Add {1} to health pool {0}",
  description: "Add health to a named health pool.",
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
      desc: "The amount of pool health to add.",
      type: "number",
      initialValue: "50",
    },
  ],
};

export const expose = true;

export default function (type, amount) {
  this.addTempHealth(type, amount);
}
