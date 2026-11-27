export const config = {
  listName: "On status",
  displayText: "{my} On status {0} {1}",
  description: "Triggers when a status is applied, reapplied, ticks, expires or is removed.",
  isTrigger: true,
  isInvertible: false,
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status to listen for. Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    },
    {
      id: "event",
      name: "Event",
      desc: "Applied: became active. Reapplied: applied while active. Ticked: after each tick. Expired: ran out of time or stacks. Removed: ended for any reason.",
      type: "combo",
      initialValue: "applied",
      items: [
        { applied: "Applied" },
        { reapplied: "Reapplied" },
        { ticked: "Ticked" },
        { expired: "Expired" },
        { removed: "Removed" },
      ],
    },
  ],
};

export const expose = true;

export default function (name, event) {
  // event arrives as a 0-based index into the items above
  return this.isLastStatusEvent(event) && this.isLastStatus(name);
}
