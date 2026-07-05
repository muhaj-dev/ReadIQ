import { Image } from 'expo-image';

import { brandAspect, images } from '@/constants/images';

type Props = {
  /** Rendered width in px. Height is derived from the logo's aspect ratio. */
  width?: number;
};

/** The square "✦ IQ" brand mark (transparent PNG). Used on the first splash stage. */
export function NoteIqMark({ width = 150 }: Props) {
  return (
    <Image
      source={images.mark}
      style={{ width, height: width * brandAspect.mark }}
      contentFit="contain"
      accessibilityLabel="noteIQ"
    />
  );
}

/** The full "noteIQ" wordmark lockup (transparent PNG). Used on the second splash stage. */
export function NoteIqWordmark({ width = 240 }: Props) {
  return (
    <Image
      source={images.wordmark}
      style={{ width, height: width * brandAspect.wordmark }}
      contentFit="contain"
      accessibilityLabel="noteIQ"
    />
  );
}
