import { ignoresConfig, nodeLanguageOptions } from "./base.js";

const rootConfig = [
  ...ignoresConfig,
  {
    files: ["*.js"],
    languageOptions: nodeLanguageOptions,
  },
];

export default rootConfig;
