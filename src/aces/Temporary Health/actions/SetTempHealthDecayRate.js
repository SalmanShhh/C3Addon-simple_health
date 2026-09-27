export const config = {
  listName: "Set health pool decay rate",
  displayText: "{my}: Set health pool {0} decay rate to {1} per second",
  description: "Set how much a health pool drains per second. 0 disables decay.",
  isAsync: false,
  highlight: false,
  isDeprecated: true,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "rate",
      name: "Rate",
      desc: "Pool health lost per second (0 = no decay).",
      type: "number",
      initialValue: "5",
    },
  ],
};

export const expose = true;

export default function (type, rate) {
  this.setTempHealthDecayRate(type, rate);
}
