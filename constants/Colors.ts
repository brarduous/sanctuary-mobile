const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  gray: '#9CA3AF', // Tailwind gray-400
  light: {
    text: '#000',
    background: '#fff',
    card: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    card: '#1c1c1e',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
