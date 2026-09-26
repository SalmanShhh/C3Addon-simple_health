export const config = {
  listName: "On health pool increased",
  displayText: "{my} On health pool increased",
  description: "Triggers when health is added to a pool. Use LastPoolName for the pool.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
