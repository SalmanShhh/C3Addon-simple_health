export const config = {
  listName: "On revived",
  displayText: "{my} On revived",
  description: "Triggers when the instance is revived from death.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
