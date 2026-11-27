export const config = {
  listName: "Has status",
  displayText: "{my} Has status {0}",
  description: "True if the status is currently active.",
  isTrigger: false,
  isInvertible: true,
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status to check. Not case-sensitive.",
      type: "string",
      initialValue: '"burn"',
    }
  ],
};

export const expose = true;

export default function (name) {
  return this.hasStatus(name);
}
