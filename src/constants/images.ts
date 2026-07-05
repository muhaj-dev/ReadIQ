// src/constants/images.ts
// Centralized image imports (see AGENTS.md → Image Rule).
// Never import image assets directly inside screens or components — import from here.
//
// Brand marks are cleaned, transparent PNGs (background removed) so they composite
// crisply on the light splash gradient and any card background.

const mark = require('@/assets/images/brand/noteiq-mark.png'); // square "✦ IQ" glyph
const wordmark = require('@/assets/images/brand/noteiq-wordmark.png'); // full "noteIQ" lockup

export const images = { mark, wordmark };

// Intrinsic aspect ratios (height / width) of the transparent PNGs above —
// used to size the logo by width while preserving proportions.
export const brandAspect = {
  mark: 811 / 587,
  wordmark: 599 / 969,
} as const;
