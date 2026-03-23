export const config = {
  returnType: "string",
  description: "The name of the temporary health pool that fired the most recent 'On temp health depleted' or 'On temp health absorbed damage' trigger.",
  highlight: false,
  deprecated: false,
  params: [],
};

export const expose = false;

export default function () {
  return this.getLastTriggerTempType();
}
