import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.{js,jsx}'],
        ignores: ['src/**/*.module.css'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                browser: true,
                es2020: true,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        settings: { react: { version: '18.3' } },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'react/prop-types': 'off',
            'no-unused-vars': 'warn',
            'no-console': 'off',
        },
    },
];
