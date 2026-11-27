export const config = {
  returnType: "string",
  description: "Name of the active status at a 0-based index, in the order they became active.",
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "index",
      name: "Index",
      desc: "0-based index, from 0 to StatusCount - 1.",
      type: "number",
    }
  ],
};

export const expose = true;

export default function (index) {
  return this.getStatusByIndex(index);
}
