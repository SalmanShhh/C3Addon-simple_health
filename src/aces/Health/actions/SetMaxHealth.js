export const config = {
  listName: "Set max health",
  displayText: "Set max health to {0}",
  description: "Set the instance's maximum health (minimum 1).",
  params: [
    {
      id: "amount",
      name: "Amount",
      desc: "New maximum health value.",
      type: "number",
      initialValue: "100",
    },
  ],
};

export const expose = true;

export default function (amount) {
  this.setMaxHealth(amount);
}
