/** @type {import('tailwindcss').Config} */
// Tailwind (v3) + NativeWind v4 config.
// `content` must cover every file that uses className so those classes are kept.
// Theme COLORS are intentionally not defined here — colours come from
// `useTheme()` at runtime (light/dark), per AGENTS.md. Tailwind is used only for
// layout, spacing, flex, sizing, and radii.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      borderRadius: {
        card: '16px', // Cards
        inner: '12px', // Inner cards
        btn: '12px', // Buttons
        pill: '999px', // Pills / tags (the "From your notes" tag)
      },
    },
  },
  plugins: [],
};
