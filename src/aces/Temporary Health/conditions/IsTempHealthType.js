export const config = {
  listName: "Temp health pool is type",
  displayText: "Temp health pool is {0}",
  description: "True if the temporary health pool that fired the last trigger matches the given type name. Use inside 'On temp health depleted' or 'On temp health absorbed damage' to filter by pool.",
  isTrigger: false,
  isInvertible: true,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "The pool name to match against the last triggered pool.",
      type: "string",
      initialValue: '"shield"',
    },
  ],
};

export const expose = true;

export default function (type) {
  return this.isTempHealthType(type);
}
