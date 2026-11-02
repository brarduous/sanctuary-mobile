export type ScrollItemLayout = { y: number; height: number };

// Count exposure only once at least half the item (or half a small viewport)
// is visible. A tall, enlarged-text card can still qualify without clipping.
export function scrollItemIsVisible(item: ScrollItemLayout | null, offset: number, viewport: number) {
  if (!item || item.height <= 0 || viewport <= 0) return false;
  const overlap = Math.min(item.y + item.height, offset + viewport) - Math.max(item.y, offset);
  return overlap >= Math.min(item.height, viewport) / 2;
}
