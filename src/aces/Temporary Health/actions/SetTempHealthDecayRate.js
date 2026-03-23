export const config = {
  listName: "Set temp health decay rate",
  displayText: "Set {0} temp health decay rate to {1} per second",
  description: "Set how much a named temporary health pool drains per second. 0 disables decay.",
  isAsync: false,
  highlight: false,
  deprecated: true,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "rate",
      name: "Rate",
      desc: "Temporary health lost per second (0 = no decay).",
      type: "number",
      initialValue: "5",
    },
  ],
};

export const expose = true;

export default function (type, rate) {
  this.setTempHealthDecayRate(type, rate);
}
