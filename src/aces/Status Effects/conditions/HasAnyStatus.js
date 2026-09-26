export const config = {
  listName: "Has any status",
  displayText: "{my} Has any status",
  description: "True if any status is currently active.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = true;

export default function () {
  return this.hasAnyStatus();
}
