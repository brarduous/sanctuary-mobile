import { Platform } from 'react-native';

// Minimum heights are touch targets, not fixed text containers. Controls grow
// with system font scaling; titles and body text wrap without a line cap.
export const Typography = {
  screenTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  sectionHeading: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  editorialTitle: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  readingBody: { fontSize: 17, lineHeight: 28 },
  metadata: { fontSize: 13, lineHeight: 20 },
  formLabel: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  helper: { fontSize: 15, lineHeight: 23 },
  action: { fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
};
export const Layout = {
  gutter: 20,
  sectionGap: 28,
  cardPadding: 20,
  cardRadius: 20,
  controlRadius: 14,
  actionHeight: 48,
  touchTarget: 44,
  rowHeight: 56,
  iconSize: 20,
  bottomPadding: 24,
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  body: Typography.readingBody,
};
