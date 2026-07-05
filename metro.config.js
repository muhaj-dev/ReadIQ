// Metro config for Expo + NativeWind v4.
// withNativeWind points Metro at the Tailwind entry stylesheet so classes are compiled.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
