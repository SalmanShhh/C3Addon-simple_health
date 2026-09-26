export const config = {
  listName: "On status reapplied",
  displayText: "{my} On status {0} reapplied",
  description: "Triggers when a status is applied while already active.",
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
