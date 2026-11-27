export const config = {
  listName: "Set enabled",
  displayText: "{my}: Set {0}",
  description: "Enable or disable the behavior. Disabled ignores damage, healing and new statuses, and pauses timers.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "state",
      name: "State",
      desc: "Whether the behavior processes damage, healing and statuses.",
      type: "combo",
      initialValue: "enabled",
      items: [
        { disabled: "Disabled" },
        { enabled: "Enabled" },
      ],
    },
  ],
};

export const expose = true;

export default function (state) {
  // Combo arrives as a 0-based index: 0 = disabled, 1 = enabled
  this.setEnabled(state === 1);
}
