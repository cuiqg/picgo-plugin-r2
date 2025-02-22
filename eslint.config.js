import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js}"] },
  { ignores: ["**/dist"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended
];
