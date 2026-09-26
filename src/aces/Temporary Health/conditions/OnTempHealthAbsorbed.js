export const config = {
  listName: "On health pool absorbed damage",
  displayText: "{my} On health pool absorbed damage",
  description: "Triggers when a health pool absorbs incoming damage, even partially.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
