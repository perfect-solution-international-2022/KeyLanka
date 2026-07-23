export function formatOrderNumber(id: number | string) {
  return `KL-${String(id).padStart(6, "0")}`;
}
