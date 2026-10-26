const baseGlobals = {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  lucide: "readonly",
  fetch: "readonly",
  caches: "readonly",
  self: "readonly",
  URL: "readonly",
  Response: "readonly",
  Promise: "readonly",
  localStorage: "readonly",
  process: "readonly",
  navigator: "readonly",
  location: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  AbortController: "readonly",
  AbortSignal: "readonly",
  TextDecoder: "readonly",
  TextEncoder: "readonly",
  atob: "readonly",
  btoa: "readonly",
  Blob: "readonly",
  module: "readonly",
  define: "readonly"
};

const warnRules = {
  "no-unused-vars": "warn",
  "no-undef": "warn",
  "no-empty": "warn",
  "no-fallthrough": "warn",
  "no-self-assign": "warn",
  "no-redeclare": "warn",
  "no-func-assign": "warn",
  "no-useless-escape": "warn",
  "no-misleading-character-class": "warn",
  "no-dupe-keys": "warn"
};

export default [
  {
    ignores: ["dist/**", "archive/**", "vendor/**", "_dev/**", "node_modules/**", "tools/**", "assets/lib/**", "**/*.min.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: baseGlobals
    },
    rules: warnRules
  },
  {
    files: ["**/*.mjs", "vitest.config.js", "eslint.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: baseGlobals
    },
    rules: warnRules
  }
];