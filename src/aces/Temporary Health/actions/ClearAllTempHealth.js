export const config = {
  listName: "Clear all health pools",
  displayText: "{my}: Clear all health pools",
  description: "Empty every health pool on this instance.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  this.clearAllTempHealth();
}
