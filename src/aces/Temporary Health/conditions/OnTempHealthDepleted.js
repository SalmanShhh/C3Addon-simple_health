export const config = {
  listName: "On temp health depleted",
  displayText: "On temp health depleted",
  description: "Triggers when temporary health reaches zero (from damage or time decay).",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
