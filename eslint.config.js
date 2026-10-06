import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/**', 'public/dist/**', 'uploads/**', '.superpowers/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'scripts/**/*.js', '*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser, $: 'readonly', d3: 'readonly', io: 'readonly' },
    },
  },
  {
    files: ['client/**/*.jsx'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
  { rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
  prettier,
];
