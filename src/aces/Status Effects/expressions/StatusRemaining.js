export const config = {
  returnType: "number",
  description: "Seconds or turns left on a status. -1 if permanent, 0 if not active.",
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "name",
      name: "Status",
      desc: "Name of the status. Not case-sensitive.",
      type: "string",
    }
  ],
};

export const expose = true;

export default function (name) {
  return this.getStatusRemaining(name);
}
