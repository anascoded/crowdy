// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Apply this configuration block to all your source files
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // 1. Suppresses the unused modules/exports warnings globally
      'import/no-unused-modules': 'off',
      // 2. Turns off alternative lint extensions that flag unused exports
      'import/no-default-export': 'off',
      // Switches off the strict "no unused variables" rules for TypeScript
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
]);