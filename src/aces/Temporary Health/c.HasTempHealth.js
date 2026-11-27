export const config = {
  listName: "Health pool has health",
  displayText: "{my} Health pool {0} has health",
  description: "True if the named health pool has health remaining.",
  isTrigger: false,
  isInvertible: true,
  params: [
    {
      id: "type",
      name: "Pool",
      desc: "Name of the health pool to check.",
      type: "string",
      initialValue: '"shield"',
    },
  ],
};

export const expose = true;

export default function (type) {
  return this.hasTempHealth(type);
}
