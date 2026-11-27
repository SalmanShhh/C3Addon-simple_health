export const config = {
  listName: "Remove status",
  displayText: "{my}: Remove status {0}",
  description: "Remove a status immediately, firing On status (Removed).",
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"burn\", \"poison\"). Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    }
  ],
  isAsync: false,
  highlight: false,
  isDeprecated: false,
};

export const expose = true;

export default function (name) {
  this.removeStatus(name);
}
