export const config = {
  listName: "Clear temp health",
  displayText: "Clear {0} temp health",
  description: "Remove all temporary health from a named pool.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool to clear.",
      type: "string",
      initialValue: '"shield"',
    },
  ],
};

export const expose = true;

export default function (type) {
  this.clearTempHealth(type);
}
