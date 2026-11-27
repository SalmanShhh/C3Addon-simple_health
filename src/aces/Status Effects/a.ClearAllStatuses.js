export const config = {
  listName: "Clear all statuses",
  displayText: "{my}: Clear all statuses",
  description: "Remove every active status, firing On status (Removed) for each.",
  params: [],
  isAsync: false,
  highlight: false,
  isDeprecated: false,
};

export const expose = true;

export default function () {
  this.clearAllStatuses();
}
