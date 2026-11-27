export const config = {
  listName: "Set health pool priority",
  displayText: "{my}: Set health pool {0} priority to {1}",
  description: "Set a pool's absorption priority. Lower numbers absorb damage first. Default 0.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool.",
      type: "string",
      initialValue: '"shield"',
    },
    {
      id: "priority",
      name: "Priority",
      desc: "Damage absorption priority. Lower numbers are consumed first.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (type, priority) {
  this.setTempHealthPriority(type, priority);
}
