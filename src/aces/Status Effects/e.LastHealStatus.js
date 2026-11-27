export const config = {
  returnType: "string",
  description: "Name of the status that caused LastHeal. Empty if the heal was direct.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastHealStatus();
}
