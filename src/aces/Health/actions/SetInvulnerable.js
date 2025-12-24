export const config = {
  listName: "Set invulnerable",
  displayText: "Set invulnerable to [b]{0}[/b]",
  description: "Set whether the instance is invulnerable to damage.",
  params: [
    {
      id: "state",
      name: "Invulnerable",
      desc: "True to make invulnerable, false to allow damage.",
      type: "boolean",
      initialValue: false,
    },
  ],
};

export const expose = true;

export default function (state) {
  this.setInvulnerable(state);
}
