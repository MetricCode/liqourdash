const { getDefaultConfig } = require('expo/metro-config');

const getDefaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.assetExts.push('cjs');

module.exports = config;