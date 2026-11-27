export const config = {
  returnType: "string",
  description: "Deprecated: use LastPoolName. Name of the health pool that fired the most recent pool trigger.",
  highlight: false,
  isDeprecated: true,
  params: [],
};

export const expose = false;

export default function () {
  return this.getLastTriggerTempType();
}
