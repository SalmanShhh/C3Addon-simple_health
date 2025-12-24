export const config = {
  returnType: "number",
  description: "Amount of last damage taken.",
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastDamage();
}
