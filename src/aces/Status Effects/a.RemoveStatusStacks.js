export const config = {
  listName: "Remove status stacks",
  displayText: "{my}: Remove {1} stack(s) of status {0}",
  description: "Remove stacks from a status. Reaching 0 stacks removes the status.",
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"burn\", \"poison\"). Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    },
    {
      id: "count",
      name: "Count",
      desc: "Number of stacks to remove.",
      type: "number",
      initialValue: "1",
    }
  ],
  isAsync: false,
  highlight: false,
  isDeprecated: false,
};

export const expose = true;

export default function (name, count) {
  this.removeStatusStacks(name, count);
}
