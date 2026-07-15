import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The React Compiler-era hooks rules over-fire on this app's intentional imperative code: the
    // theme switcher *must* write document.cookie + data-theme to re-skin instantly, the profile
    // menu keeps a latest-value ref for its click-outside save, and the product tour measures a
    // target element's rect in an effect to position its spotlight. These are correct, so we track
    // the rules as warnings rather than letting them block the build.
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
