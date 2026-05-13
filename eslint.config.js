const { readFileSync } = require('fs');
const path = require('path');

const eslintrc = JSON.parse(readFileSync(path.join(__dirname, '.eslintrc.json'), 'utf8'));

module.exports = [
  {
    ignores: eslintrc.ignorePatterns || [],
    rules: eslintrc.rules || {},
    languageOptions: {
      ecmaVersion: eslintrc.parserOptions?.ecmaVersion || 'latest',
      sourceType: 'module',
      globals: {
        ...(eslintrc.env?.browser ? { window: 'readonly', document: 'readonly', console: 'readonly' } : {}),
        ...(eslintrc.env?.node ? { process: 'readonly', __dirname: 'readonly', module: 'writable', require: 'readonly' } : {}),
      },
    },
  },
];
