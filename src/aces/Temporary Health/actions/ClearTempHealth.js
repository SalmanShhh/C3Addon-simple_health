export const config = {
  listName: "Clear health pool",
  displayText: "{my}: Clear health pool {0}",
  description: "Empty a named health pool.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool to clear.",
      type: "string",
      initialValue: '"shield"',
    },
  ],
};

export const expose = true;

export default function (type) {
  this.clearTempHealth(type);
}
