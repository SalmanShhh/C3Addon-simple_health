export const config = {
  listName: "Take damage",
  displayText: "Take [b]{0}[/b] damage",
  description: "Reduce health by the specified amount.",
  params: [
    {
      id: "amount",
      name: "Amount",
      desc: "The amount of damage to take.",
      type: "number",
      initialValue: "10",
    },
  ],
};

export const expose = true;

export default function (amount) {
  this.takeDamage(amount);
}