export const config = {
  listName: "Is invulnerable",
  displayText: "Is invulnerable",
  description: "True if the instance is currently invulnerable to damage.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = true;

export default function () {
  return this.isInvulnerable();
}
