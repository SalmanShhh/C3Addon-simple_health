export const config = {
  listName: "Set health",
  displayText: "Set health to [b]{0}[/b]",
  description: "Set the instance's current health (clamped between 0 and max).",
  params: [
    {
      id: "amount",
      name: "Amount",
      desc: "New health value.",
      type: "number",
      initialValue: "100",
    },
  ],
};

export const expose = true;

export default function (amount) {
  this.setHealth(amount);
}
