export const config = {
  listName: "Advance status turns",
  displayText: "{my}: Advance statuses by {0} turn(s)",
  description: "Advance all turn-based statuses: tick, drain stacks and expire them.",
  params: [
    {
      id: "count",
      name: "Turns",
      desc: "Number of turns to advance (whole number, at least 1).",
      type: "number",
      initialValue: "1",
    }
  ],
  isAsync: false,
  highlight: false,
  isDeprecated: false,
};

export const expose = true;

export default function (count) {
  this.advanceStatusTurns(count);
}
