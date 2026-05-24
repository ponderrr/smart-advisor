import js from "@eslint/js";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".next",
      "node_modules",
      "coverage",
      "supabase/functions",
      "next-env.d.ts",
    ],
  },
  {
    extends: [js.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
        projectService: true,
      },
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      // The @next/next plugin is registered so the rule names that
      // the codebase's `// eslint-disable-next-line @next/next/...`
      // comments reference are defined — without this, ESLint 9 flat
      // config errors with "Definition for rule '@next/next/...' was
      // not found" on every disable directive that targets one.
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
