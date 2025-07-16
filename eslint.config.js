const { FlatCompat } = require('@eslint/eslintrc')
const path = require('path')

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('next/typescript'),
  {
    rules: {
      // JavaScript/General Rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      eqeqeq: 'error',

      // TypeScript Rules (basic ones that don't require type info)
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React Rules
      'react/no-unescaped-entities': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off', // We use TypeScript for prop validation

      // Next.js Rules
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
      },
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'out/', 'build/', 'dist/', '*.config.js', '*.config.ts'],
  },
]

module.exports = eslintConfig
