import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';

// Splash-only element — always light (see splash-background.tsx).
const light = Colors.light;

type Props = {
  /** How long the bar takes to fill, in ms. */
  duration?: number;
  /** Fired once the bar reaches 100%. */
  onComplete?: () => void;
  width?: number;
};

export function LoadingBar({ duration = 1000, onComplete, width = 80 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }, (finished) => {
      'worklet';
      if (finished && onComplete) scheduleOnRN(onComplete);
    });
  }, [duration, onComplete, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  // Layout via NativeWind; the animated width and colours stay in style
  // (Animated values are a Style Exception Rule, `width` is a runtime prop).
  return (
    <View
      className="h-1 overflow-hidden rounded-pill"
      style={{ width, backgroundColor: light.loadingTrack }}>
      <Animated.View
        className="h-full rounded-pill"
        style={[fillStyle, { backgroundColor: light.loadingFill }]}
      />
    </View>
  );
}
