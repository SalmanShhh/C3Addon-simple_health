export const config = {
  returnType: "string",
  description: "Name of the health pool that fired the most recent pool trigger.",
  highlight: false,
  isDeprecated: false,
  params: [],
};

export const expose = true;

export default function () {
  return this.getLastTriggerTempType();
}
