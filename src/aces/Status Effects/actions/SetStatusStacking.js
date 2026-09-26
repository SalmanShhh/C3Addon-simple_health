export const config = {
  listName: "Set status stacking",
  displayText: "{my}: Set status {0} stacking: max {1}, on reapply {2}, lose {3} stack(s) per tick",
  description: "Set how a status stacks and how its duration reacts to reapplying.",
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status (e.g. \"burn\", \"poison\"). Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    },
    {
      id: "maxStacks",
      name: "Max stacks",
      desc: "Maximum stacks. -1 = unlimited.",
      type: "number",
      initialValue: "-1",
    },
    {
      id: "reapplyMode",
      name: "On reapply",
      desc: "Refresh resets the duration, extend adds to it, keep leaves it unchanged.",
      type: "combo",
      initialValue: "refresh",
      items: [
        {
          refresh: "refresh",
        },
        {
          extend: "extend",
        },
        {
          keep: "keep",
        }
      ],
    },
    {
      id: "stacksLostPerTick",
      name: "Stacks lost per tick",
      desc: "Stacks removed after each tick. 0 = stacks never drain.",
      type: "number",
      initialValue: "0",
    }
  ],
  isAsync: false,
  highlight: false,
  deprecated: false,
};

export const expose = true;

export default function (name, maxStacks, reapplyMode, stacksLostPerTick) {
  this.setStatusStacking(name, maxStacks, reapplyMode, stacksLostPerTick);
}
