import { ignoresConfig, javascriptConfig, nodeLanguageOptions } from "./base.js";

const nodeConfig = [
  ...ignoresConfig,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: nodeLanguageOptions,
  },
  ...javascriptConfig,
];

export default nodeConfig;
