/**
 * Matcha Latte Theme - Kyou App Color System
 * Inspired by Japanese Tea Ceremony (茶道)
 */

// Brand Colors - Matcha Green
export const brand = {
  DEFAULT: '#7AA06E', // Primary Action / Success
  light: '#EFF5ED',   // Matcha Milk - Backgrounds / Secondary
  dark: '#56744C',    // Deep Matcha - Active States
};

// Background Colors
export const background = {
  canvas: '#FAFAF8',  // Off-White / Rice Paper - Main Background
  surface: '#FFFFFF', // Pure White - Card Background
};

// Text Colors
export const text = {
  main: '#4B4036',    // Earth Brown / Coffee - Main Text
  sub: '#8C857B',     // Latte Beige - Sub Text / Hints
};

// Semantic Colors
export const semantic = {
  accent: '#EBCD78',  // Yuzu Yellow / Honey - Highlights / Badges
  error: '#D97D7D',   // Azuki Red - Error / Alert
  success: '#7AA06E', // Same as brand
};

// Tab Bar Colors
export const tabBar = {
  active: brand.DEFAULT,
  inactive: text.sub,
  background: background.surface,
  border: brand.light,
};

// Consolidated Colors Export
const Colors = {
  light: {
    text: text.main,
    textSub: text.sub,
    background: background.canvas,
    surface: background.surface,
    tint: brand.DEFAULT,
    tabIconDefault: text.sub,
    tabIconSelected: brand.DEFAULT,
    brand: brand.DEFAULT,
    brandLight: brand.light,
    brandDark: brand.dark,
    accent: semantic.accent,
    error: semantic.error,
  },
  dark: {
    // Dark mode - slightly adjusted for accessibility
    text: '#F5F5F3',
    textSub: '#A8A29E',
    background: '#1A1A18',
    surface: '#2D2D2A',
    tint: '#8FB883',
    tabIconDefault: '#A8A29E',
    tabIconSelected: '#8FB883',
    brand: '#8FB883',
    brandLight: '#2D3D2A',
    brandDark: '#6B9460',
    accent: '#F0D88A',
    error: '#E89B9B',
  },
};

export default Colors;
