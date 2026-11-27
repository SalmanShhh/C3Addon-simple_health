export const config = {
  listName: "Is health pool",
  displayText: "{my} Triggering health pool is {0}",
  description: "True if the pool that fired the last pool trigger has this name.",
  isTrigger: false,
  isInvertible: true,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "The pool name to match against the pool that fired the last trigger.",
      type: "string",
      initialValue: '"shield"',
    },
  ],
};

export const expose = true;

export default function (type) {
  return this.isTempHealthType(type);
}
