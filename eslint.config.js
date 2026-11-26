import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// Only the two hook rules: TypeScript (strict, noUnused*) already covers the rest.
export default [
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
];
