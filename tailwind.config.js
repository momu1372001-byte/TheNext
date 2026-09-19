/** @type {import('tailwindcss').Config} */
import { colors, spacing, typography, radii, shadows } from './src/theme';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      borderRadius: radii,
      boxShadow: shadows,
    },
  },
  plugins: [],
};
