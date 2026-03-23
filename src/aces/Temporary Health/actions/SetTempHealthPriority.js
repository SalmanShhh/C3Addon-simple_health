export const config = {
  listName: "Set temp health pool priority",
  displayText: "Set {0} temp health pool priority to {1}",
  description: "Set the damage-absorption priority for a named pool. Lower numbers are consumed first. Default is 0. Use this to reorder existing pools without changing their amounts or rates.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool.",
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
