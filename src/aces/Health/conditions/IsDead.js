export const config = {
  listName: "Is dead",
  displayText: "Is dead",
  description: "True if the instance is dead (health is 0).",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = true;

export default function () {
  return this.isDead();
}
