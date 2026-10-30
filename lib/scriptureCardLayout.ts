export const SCRIPTURE_CARD_CHROME_HEIGHT = 148;
/** Width:height is 1:1 for short passages, up to 3:4 for long ones. */
export function scriptureCardHeight(width: number, textHeight: number) {
  const safeWidth = Math.max(width, 1);
  return Math.min(safeWidth * 4 / 3, Math.max(safeWidth, textHeight + SCRIPTURE_CARD_CHROME_HEIGHT));
}
