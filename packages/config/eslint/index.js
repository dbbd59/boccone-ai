// Shared ESLint flat config for all Boccone AI workspaces.
// Usage (root eslint.config.js): export default defineConfig();
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * @param {object} [options]
 * @param {boolean} [options.react] Enable React/RN-specific rules (mobile, admin, ui packages).
 * @returns {import("eslint").Linter.Config[]}
 */
export function defineConfig(options = {}) {
  const { react = false } = options;

  /** @type {import("eslint").Linter.Config[]} */
  const configs = [
    {
      ignores: [
        "**/dist/**",
        "**/.expo/**",
        "**/.turbo/**",
        "**/node_modules/**",
        "**/coverage/**",
        "**/drizzle/**",
        "**/.expo-shared/**",
        "**/src/generated/**",
      ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.browser,
        },
        parserOptions: {
          projectService: true,
          tsconfigRootDir: process.cwd(),
        },
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { fixStyle: "inline-type-imports" },
        ],
        "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
      },
    },
  ];

  if (react) {
    configs.push({
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      rules: {
        ...reactHooks.configs["recommended-latest"].rules,
        "react-refresh/only-export-components": "warn",
      },
    });
  }

  return configs;
}
