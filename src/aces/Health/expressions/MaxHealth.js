export const config = {
  returnType: "number",
  description: "Maximum health of the instance.",
  params: [],
};

export const expose = true;

export default function () {
  return this.getMaxHealth();
}
