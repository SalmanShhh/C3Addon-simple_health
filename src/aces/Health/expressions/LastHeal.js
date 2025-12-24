export const config = {
  returnType: "number",
  description: "Amount of last healing applied.",
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastHeal();
}
