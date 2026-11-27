export const config = {
  returnType: "string",
  description: "Name of the health pool at a 0-based index, in the order pools absorb damage (priority, then creation).",
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "index",
      name: "Index",
      desc: "0-based index, from 0 to PoolCount - 1.",
      type: "number",
    },
  ],
};

export const expose = true;

export default function (index) {
  return this.getPoolByIndex(index);
}
