export const config = {
  listName: "On status expired",
  displayText: "{my} On status {0} expired",
  description: "Triggers when a status runs out of time or stacks.",
  isTrigger: true,
  isInvertible: false,
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status to listen for. Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    }
  ],
};

export const expose = true;

export default function (name) {
  return this.isLastStatus(name);
}
