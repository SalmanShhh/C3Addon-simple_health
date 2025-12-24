export const config = {
  listName: "Revive",
  displayText: "Revive instance",
  description: "Revive the instance and restore it to max health.",
  params: [],
};

export const expose = true;

export default function () {
  this.revive();
}
