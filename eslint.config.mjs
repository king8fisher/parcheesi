import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noInArray from "eslint-plugin-no-in-array";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-plugin-react's "detect" calls context.getFilename(), removed in ESLint 10.
    settings: {
      react: { version: "19.3" },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "no-in-array": noInArray,
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "no-in-array/check": "warn",
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  globalIgnores([".next/**", "node_modules/**"]),
]);