import Animated, { FadeIn } from 'react-native-reanimated';

import { LoadingBar } from '@/components/splash/loading-bar';

type Props = {
  /** How long the loading bar fills before advancing, in ms. */
  durationMs?: number;
  /** Called once the loading bar completes (advance to onboarding). */
  onComplete: () => void;
};

/**
 * Splash footer — the loading bar fades in at the bottom once the logo has
 * settled, fills for ~1s (purely an intro animation), then advances.
 */
export function SplashFooter({ durationMs = 1000, onComplete }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="absolute bottom-16 items-center">
      <LoadingBar duration={durationMs} onComplete={onComplete} />
    </Animated.View>
  );
}
