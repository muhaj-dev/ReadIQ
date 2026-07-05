import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  /** Where a right-swipe returns to. Defaults to router.back() → /home. */
  onBack?: () => void;
};

// Only a drag that STARTS within this many px of the left edge counts as
// "back" — the same affordance as the iOS / Android system back gesture.
const EDGE_WIDTH = 40;
// Horizontal travel (px) before the pan claims the touch from the ScrollView.
const ACTIVATE_X = 16;
// Vertical travel (px) that hands the touch back to the vertical ScrollView.
const FAIL_Y = 14;

/**
 * Wraps a full-screen (non-stack) screen so an edge swipe left→right goes back,
 * mirroring the native back gesture the pushed screens (e.g. /add) get for free.
 * Ask AI is a tab, not a pushed route, so it needs this to feel the same.
 */
export function SwipeBackView({ children, onBack }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const startX = useSharedValue(0);
  const translateX = useSharedValue(0);

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  const pan = Gesture.Pan()
    .activeOffsetX(ACTIVATE_X)
    .failOffsetY([-FAIL_Y, FAIL_Y])
    .onBegin((e) => {
      startX.value = e.x;
    })
    .onUpdate((e) => {
      if (startX.value > EDGE_WIDTH) return; // not an edge swipe — ignore
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (startX.value > EDGE_WIDTH) return;
      const release = e.translationX > width * 0.35 || e.velocityX > 800;
      if (release) {
        translateX.value = withTiming(width, { duration: 180 }, (done) => {
          if (done) {
            runOnJS(goBack)();
            translateX.value = 0; // reset off-screen; the tab stays mounted
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
