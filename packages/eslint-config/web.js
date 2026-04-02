import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import {
  browserLanguageOptions,
  ignoresConfig,
  javascriptConfig,
} from "./base.js";

const webConfig = [
  ...ignoresConfig,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,vue}"],
    languageOptions: {
      ...browserLanguageOptions,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  ...javascriptConfig,
  ...pluginVue.configs["flat/essential"],
];

export default webConfig;
