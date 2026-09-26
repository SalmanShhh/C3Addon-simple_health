export const config = {
  listName: "On status applied",
  displayText: "{my} On status {0} applied",
  description: "Triggers when a status becomes active.",
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
