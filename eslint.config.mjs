import { FlatCompat } from "@eslint/eslintrc";
import baseDefault from "@phoenix35/eslint-config";
import { dirname } from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname_ = dirname(filename);

const compat = new FlatCompat({ baseDirectory: dirname_ });

const eslintConfig = [
  ...baseDefault,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/dev/*",
      "**/dist/*",
      "**/tests/*",
      "tsconfig.json",
    ],
  },
  {
    languageOptions: { sourceType: "module" },
    rules: {
      // curly braces for all blocks
      curly: [ "error", "all" ],
      // double quotes
      "@stylistic/js/quotes": [ "error", "double", { avoidEscape: true } ],
      // statement beside the control
      "@stylistic/js/nonblock-statement-body-position": [ "error", "below" ],
      // disable camelcase rule
      camelcase: "off",
      // disable new-cap rule
      "new-cap": "off",
    },
  },
];

export default eslintConfig;
