// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Desactiva las reglas de estilo que ya resuelve Prettier
  eslintConfigPrettier,
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
