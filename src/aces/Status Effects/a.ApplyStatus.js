export const config = {
  listName: "Apply status",
  displayText: "{my}: Apply status {0} for {1} {2} with {3} stack(s)",
  description: "Apply or reapply a status for a duration in seconds or turns.",
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"burn\", \"poison\"). Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    },
    {
      id: "duration",
      name: "Duration",
      desc: "How long the status lasts, in the chosen unit. Use -1 for permanent.",
      type: "number",
      initialValue: "5",
    },
    {
      id: "unit",
      name: "Unit",
      desc: "Seconds count down automatically. Turns only count down with 'Advance status turns'.",
      type: "combo",
      initialValue: "seconds",
      items: [
        {
          seconds: "Seconds",
        },
        {
          turns: "Turns",
        }
      ],
    },
    {
      id: "stacks",
      name: "Stacks",
      desc: "Number of stacks to add (whole number, at least 1).",
      type: "number",
      initialValue: "1",
    }
  ],
  isAsync: false,
  highlight: false,
  isDeprecated: false,
};

export const expose = true;

export default function (name, duration, unit, stacks) {
  this.applyStatus(name, duration, unit, stacks);
}
