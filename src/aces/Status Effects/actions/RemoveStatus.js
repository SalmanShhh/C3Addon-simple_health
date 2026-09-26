export const config = {
  listName: "Remove status",
  displayText: "{my}: Remove status {0}",
  description: "Remove a status immediately, firing 'On status removed'.",
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
  deprecated: false,
};

export const expose = true;

export default function (name) {
  this.removeStatus(name);
}
