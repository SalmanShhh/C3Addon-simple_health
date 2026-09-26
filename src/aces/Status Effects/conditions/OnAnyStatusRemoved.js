export const config = {
  listName: "On any status removed",
  displayText: "{my} On any status removed",
  description: "Triggers whenever any status ends. Use LastStatus for its name.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
