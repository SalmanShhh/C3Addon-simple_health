export const config = {
  listName: "Set status time remaining",
  displayText: "{my}: Set status {0} time remaining to {1}",
  description: "Set the time remaining on an active status, in its unit. 0 expires it, -1 makes it permanent.",
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
      name: "Time remaining",
      desc: "Seconds or turns left (matches the status unit). 0 expires it, -1 = permanent.",
      type: "number",
      initialValue: "5",
    }
  ],
  isAsync: false,
  highlight: false,
  isDeprecated: false,
};

export const expose = true;

export default function (name, value) {
  this.setStatusRemaining(name, value);
}
