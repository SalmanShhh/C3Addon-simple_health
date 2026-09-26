export const config = {
  listName: "Any health pool has health",
  displayText: "{my} Any health pool has health",
  description: "True if any health pool has health remaining.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = true;

export default function () {
  return this.hasAnyTempHealth();
}
