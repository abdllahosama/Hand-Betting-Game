import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },

  // Base JS + type-aware TypeScript rules (the strictest presets).
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        // Type-aware linting (enables the no-unsafe-* / no-explicit-any rules).
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── Hard ban on `any` ───────────────────────────────────────────────
      // Explicit `any` (writing `: any`) — tsconfig cannot catch this.
      '@typescript-eslint/no-explicit-any': 'error',
      // The operations that let `any` leak in are already errors via
      // strictTypeChecked: no-unsafe-assignment / call / member-access /
      // return / argument. Together these make the codebase `any`-free.
    },
  },

  // Config files don't belong to the app tsconfig — skip type-aware rules.
  {
    files: ['*.{js,ts}', 'vite.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  // MUST be last: turns off ESLint rules that would conflict with Prettier.
  prettier,
);
