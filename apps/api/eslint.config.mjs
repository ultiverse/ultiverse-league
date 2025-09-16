// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
   files: ['**/*.ts', '**/*.tsx'],
   languageOptions: {
     parserOptions: {
       // Explicit projects so types are 100% available to the rules
       project: [
         './tsconfig.json',
         './apps/api/tsconfig.json',        // <— adjust if your path differs
         // add more here if you lint multiple packages/apps
       ],
       tsconfigRootDir: import.meta.dirname,
       projectService: false,               // prefer explicit "project" for TS files
     },
   },
},
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn'
    },
  },
);