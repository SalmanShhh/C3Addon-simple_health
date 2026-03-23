export const config = {
  listName: "Has any temp health",
  displayText: "Has any temp health",
  description: "True if any temporary health pool has health remaining.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = true;

export default function () {
  return this.hasAnyTempHealth();
}
