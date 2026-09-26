export const config = {
  listName: "Set status periodic",
  displayText: "{my}: Set status {0} to {1} {2} per stack every {3}",
  description: "Set the damage or healing a status applies on each tick.",
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"burn\", \"poison\"). Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    },
    {
      id: "periodicType",
      name: "Type",
      desc: "What each tick does. Damage goes through health pools and absorption rate.",
      type: "combo",
      initialValue: "damage",
      items: [
        {
          none: "none",
        },
        {
          damage: "damage",
        },
        {
          heal: "heal",
        }
      ],
    },
    {
      id: "amountPerStack",
      name: "Amount per stack",
      desc: "Amount per tick, multiplied by the current stacks.",
      type: "number",
      initialValue: "1",
    },
    {
      id: "interval",
      name: "Interval",
      desc: "Tick every N seconds or turns (matches the status unit). 0 = no ticks.",
      type: "number",
      initialValue: "1",
    }
  ],
  isAsync: false,
  highlight: false,
  deprecated: false,
};

export const expose = true;

export default function (name, periodicType, amountPerStack, interval) {
  this.setStatusPeriodic(name, periodicType, amountPerStack, interval);
}
