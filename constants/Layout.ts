import { Platform } from 'react-native';

export const Layout = {
  gutter: 20,
  sectionGap: 28,
  cardRadius: 20,
  actionHeight: 48,
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  body: { fontSize: 17, lineHeight: 28 },
};
