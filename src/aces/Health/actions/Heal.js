export const config = {
    listName: "Heal",
    displayText: "Heal [b]{0}[/b] health",
    description: "Increase health by the specified amount (up to max health).",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
        {
            id: "amount",
            name: "Amount",
            desc: "Health amount to restore",
            type: "number",
            initialValue: "10",
        },
    ],
};

export const expose = true;

export default function (amount) {
    this.heal(amount);
}