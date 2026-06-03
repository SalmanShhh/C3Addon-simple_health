export const config = {
  listName: "On health changed",
  displayText: "On health changed",
  description: "Triggers whenever health changes for any reason (damage, healing, set health, revive, or max health clamp).",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
