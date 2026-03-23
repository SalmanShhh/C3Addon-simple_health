export const config = {
  listName: "Clear all temp health",
  displayText: "Clear all temp health pools",
  description: "Remove all temporary health from every named pool.",
  isAsync: false,
  highlight: false,
  deprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  this.clearAllTempHealth();
}
