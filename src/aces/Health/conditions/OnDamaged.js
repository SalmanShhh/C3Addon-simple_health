export const config = {
  listName: "On damaged",
  displayText: "On damaged",
  description: "Trigger when the instance takes damage.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true; // trigger condition, runtime will call _trigger
}
