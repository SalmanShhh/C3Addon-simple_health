export const config = {
  listName: "On any status",
  displayText: "{my} On any status {0}",
  description: "Triggers when any status is applied, reapplied, ticks, expires or is removed. Use LastStatus for its name.",
  isTrigger: true,
  isInvertible: false,
  params: [
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

export default function (event) {
  // event arrives as a 0-based index into the items above
  return this.isLastStatusEvent(event);
}
