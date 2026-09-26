export const config = {
  returnType: "number",
  description: "Duration the status was last applied with. -1 if permanent, 0 if not active.",
  highlight: false,
  deprecated: false,
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
  return this.getStatusDuration(name);
}
