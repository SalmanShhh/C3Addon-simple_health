export const config = {
  listName: "Revive",
  displayText: "Revive instance (health: {0})",
  description: "Revive the instance. Use -1 to restore to max health, or specify an amount.",
  params: [
    {
      id: "amount",
      name: "Amount",
      desc: "Health to restore on revive. Use -1 to restore to max health.",
      type: "number",
      initialValue: "-1",
    },
  ],
};

export const expose = true;

export default function (amount) {
  this.revive(amount);
}
