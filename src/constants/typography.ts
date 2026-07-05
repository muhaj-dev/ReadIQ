// src/constants/typography.ts
// Font families from the design mocks (see each mock's <head> fonts):
//   headings / display → Manrope · body / labels → Hanken Grotesk
// Loaded in app/_layout.tsx via useFonts. Each weight is its own family name —
// never pair these with fontWeight, or Android falls back to the system font.

export const fonts = {
  // Headlines & display — Manrope
  headingMedium: 'Manrope_500Medium',
  headingSemibold: 'Manrope_600SemiBold',
  headingBold: 'Manrope_700Bold',
  headingExtrabold: 'Manrope_800ExtraBold',
  // Body & labels — Hanken Grotesk
  bodyRegular: 'HankenGrotesk_400Regular',
  bodyItalic: 'HankenGrotesk_400Regular_Italic', // real face — Android won't synthesize italics
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemibold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
} as const;
