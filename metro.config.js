// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Some dependencies (e.g. Zustand) ship an ESM build containing `import.meta`,
// which Metro's web bundler doesn't transform, causing a hard runtime crash
// ("Cannot use 'import.meta' outside a module") and a blank page. Disabling
// package-exports resolution makes Metro fall back to each package's classic
// CommonJS entry point instead of the ESM one referenced by "exports".
config.resolver.unstable_enablePackageExports = false;

module.exports = config;