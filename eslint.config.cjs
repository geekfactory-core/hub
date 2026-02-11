const {defineConfig, globalIgnores} = require('eslint/config');
const tsParser = require('@typescript-eslint/parser');
const {fixupConfigRules} = require('@eslint/compat');
const js = require('@eslint/js');
const {FlatCompat} = require('@eslint/eslintrc');
const noCommentedCode = require('eslint-plugin-no-commented-code');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([
    {
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: 'module',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },

                project: './frontend/tsconfig.json',
                tsconfigRootDir: __dirname
            }
        },
        plugins: {
            'no-commented-code': noCommentedCode
        },
        extends: fixupConfigRules(compat.extends('plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:@typescript-eslint/recommended')),

        settings: {
            react: {
                version: 'detect'
            }
        },

        rules: {
            'react/display-name': 'off',
            'react-hooks/set-state-in-effect': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            'react-hooks/exhaustive-deps': 'error'
        }
    },
    {
        files: ['**/*.tsx', '**/*.ts'],

        rules: {
            'no-inline-comments': 'warn',
            'no-warning-comments': 'warn',
            'no-commented-code/no-commented-code': 'warn',
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                    children: 'ignore'
                }
            ],

            curly: ['error', 'all'],
            'react/no-children-prop': 'off',
            'react/prop-types': 'off',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],

            '@typescript-eslint/no-explicit-any': 'off',
            'prefer-spread': 'off',
            'react/react-in-jsx-scope': 'off',

            '@typescript-eslint/array-type': [
                'warn',
                {
                    default: 'generic'
                }
            ],

            '@typescript-eslint/await-thenable': 'error'
        }
    },
    {
        files: ['**/*.d.ts'],
        rules: {
            'no-commented-code/no-commented-code': 'off'
        }
    },
    globalIgnores(['bin', '**/node_modules', 'src/declarations', 'release/frontend', '**/eslint.config.cjs', '**/vitest.config.ts', '**/vite.config.js'])
]);
