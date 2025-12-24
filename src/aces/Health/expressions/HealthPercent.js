export const config = {
  returnType: "number",
  description: "Current health as a percentage of max health.",
  params: [],
};

export const expose = true;

export default function () {
  return this.getHealthPercent();
}
