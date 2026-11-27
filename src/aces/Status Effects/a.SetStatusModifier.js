export const config = {
  listName: "Set status modifier",
  displayText: "{my}: Set status {0} {1} multiplier to {2}",
  description: "Set a multiplier the status applies while active. Several statuses multiply together.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"corrode\"). Not case-sensitive.",
      type: "string",
      initialValue: '"corrode"',
    },
    {
      id: "modifier",
      name: "Modifier",
      desc: "Health pool absorption: multiplies every health pool's absorption rate (2 = pools drain twice as fast).",
      type: "combo",
      initialValue: "pool_absorption",
      items: [{ pool_absorption: "Health pool absorption" }],
    },
    {
      id: "value",
      name: "Multiplier",
      desc: "1 = no change, 2 = double, 0.5 = half, 0 = pools never deplete from damage.",
      type: "number",
      initialValue: "2",
    },
  ],
};

export const expose = true;

export default function (name, modifier, value) {
  this.setStatusModifier(name, modifier, value);
}
