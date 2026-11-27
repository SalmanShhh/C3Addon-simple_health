export const config = {
  listName: "Is enabled",
  displayText: "{my} Is enabled",
  description: "True if the behavior is enabled.",
  isTrigger: false,
  isInvertible: true,
  params: [],
};

export const expose = true;

export default function () {
  return this.isEnabled();
}
