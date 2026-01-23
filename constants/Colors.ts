const tintColorLight = '#D4A373'; // Accent gold
const tintColorDark = '#D4A373';  // Accent gold

export default {
  gray: '#64748B', // Slate 500 - muted foreground
  light: {
    text: '#2C3E50',        // Primary foreground
    background: '#FDFBF7',  // Paper background
    card: '#FFFFFF',        // Surface
    surface: '#FFFFFF',     // Surface
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    muted: '#F3F4F6',
    mutedForeground: '#64748B',
    border: '#E5E7EB',
  },
  dark: {
    text: '#e2e8f0',        // Slate 200
    background: '#0f172a',  // Slate 900
    card: '#1e293b',        // Slate 800 - surface
    surface: '#1e293b',     // Slate 800
    tint: tintColorDark,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    muted: '#334155',       // Slate 700
    mutedForeground: '#94a3b8', // Slate 400
    border: '#334155',
  },
};
