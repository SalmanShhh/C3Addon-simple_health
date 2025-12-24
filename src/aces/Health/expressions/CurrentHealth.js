export const config = {
  returnType: "number",
  description: "Current health of the instance.",
  params: [],
};

export const expose = true;

export default function () {
  return this.getCurrentHealth();
}
