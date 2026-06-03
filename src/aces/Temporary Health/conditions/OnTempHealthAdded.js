export const config = {
  listName: "On temp health added",
  displayText: "On temp health added",
  description: "Triggers when temporary health is added to a pool. Use LastTempHealthType to identify which pool was affected.",
  isTrigger: true,
  isInvertible: false,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}
