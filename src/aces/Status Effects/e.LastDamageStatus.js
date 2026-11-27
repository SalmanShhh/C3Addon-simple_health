export const config = {
  returnType: "string",
  description: "Name of the status that caused LastDamage. Empty if the damage was direct.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastDamageStatus();
}
