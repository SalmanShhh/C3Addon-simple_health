export const config = {
  listName: "On status ticked",
  displayText: "{my} On status {0} ticked",
  description: "Triggers after each tick of a status. Use LastTickAmount for the tick amount.",
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
