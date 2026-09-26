export const config = {
  listName: "Clear all statuses",
  displayText: "{my}: Clear all statuses",
  description: "Remove every active status, firing 'On status removed' for each.",
  params: [],
  isAsync: false,
  highlight: false,
  deprecated: false,
};

export const expose = true;

export default function () {
  this.clearAllStatuses();
}
