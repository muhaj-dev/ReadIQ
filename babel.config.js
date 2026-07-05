// Babel config for Expo + NativeWind v4.
// - babel-preset-expo handles Expo/React Native + Reanimated.
// - jsxImportSource: 'nativewind' rewrites JSX so `className` works on RN views.
// - nativewind/babel is the NativeWind preset.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
