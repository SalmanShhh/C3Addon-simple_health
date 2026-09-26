export const config = {
  listName: "On health pool depleted",
  displayText: "{my} On health pool depleted",
  description: "Triggers when a health pool reaches zero, from damage or decay.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
