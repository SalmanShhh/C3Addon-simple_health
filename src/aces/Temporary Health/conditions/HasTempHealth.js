export const config = {
  listName: "Has temp health",
  displayText: "{0} temp health pool has health",
  description: "True if a specific named temporary health pool has any health remaining.",
  isTrigger: false,
  isInvertible: true,
  params: [
    {
      id: "type",
      name: "Type",
      desc: "Name of the temporary health pool to check.",
      type: "string",
      initialValue: '"shield"',
    },
  ],
};

export const expose = true;

export default function (type) {
  return this.hasTempHealth(type);
}
