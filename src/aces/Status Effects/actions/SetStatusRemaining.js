export const config = {
  listName: "Set status remaining",
  displayText: "{my}: Set status {0} remaining to {1}",
  description: "Set the seconds or turns left on an active status. 0 expires it, -1 makes it permanent.",
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"burn\", \"poison\"). Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    },
    {
      id: "value",
      name: "Remaining",
      desc: "Seconds or turns left (matches the status unit). 0 expires it, -1 = permanent.",
      type: "number",
      initialValue: "5",
    }
  ],
  isAsync: false,
  highlight: false,
  deprecated: false,
};

export const expose = true;

export default function (name, value) {
  this.setStatusRemaining(name, value);
}
