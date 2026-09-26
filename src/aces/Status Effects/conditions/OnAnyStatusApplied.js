export const config = {
  listName: "On any status applied",
  displayText: "{my} On any status applied",
  description: "Triggers when any status becomes active. Use LastStatus for its name.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
