export const config = {
  listName: "On status removed",
  displayText: "{my} On status {0} removed",
  description: "Triggers whenever a status ends for any reason. Use for cleanup.",
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
