export const config = {
  listName: "On temp health absorbed damage",
  displayText: "On temp health absorbed damage",
  description: "Triggers when temporary health intercepts incoming damage (even partially).",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
