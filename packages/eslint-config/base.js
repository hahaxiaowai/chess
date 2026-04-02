import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export const ignoresConfig = [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/*.d.ts",
    ],
  },
];

export const javascriptConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
];

export const browserLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
  globals: globals.browser,
};

export const nodeLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
  globals: globals.node,
};
