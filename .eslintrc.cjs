/* eslint-env node */
// require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'eslint:recommended',
    "plugin:@typescript-eslint/recommended",
    // "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: "module",
  },
  ignorePatterns: ['dist/*', 'node_modules/*', '*.cjs', '.eslint.cjs'],
}
