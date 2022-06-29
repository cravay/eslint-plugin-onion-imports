import { RuleTester } from "eslint";
import onionImportsRule, { OnionImportsRuleOptions } from "./onion-imports";

/**
 * Project config is inspired by: https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/
 *
 * ┌──┐ ┌───────────┐ ┌───┐ ┌───┐
 * │UI│ │Data Access│ │WCF│ │I/O│
 * └┬┬┘ └┬┬─────────┘ └─┬┬┘ └─┬┬┘
 *  ││   ││             ││    ││
 * ┌┤▼───┤▼─────────────▼├────▼├┐
 * ││    │ Business Logic│     ││
 * └┼────┼───────────────┼─────┼┘
 *  │    │               │     │
 * ┌▼────▼───────────────▼─────▼┐
 * │       Object Model         │
 * └────────────────────────────┘
 */
const options: OnionImportsRuleOptions[] = [
  {
    layers: [
      [
        { name: "UI", patterns: ["src/ui/"] },
        { name: "Data Access", patterns: ["src/data-access/"] },
        { name: "WCF", patterns: ["src/wcf/"] },
        { name: "IO", patterns: ["src/io/"] },
      ],
      { name: "Business Logic", patterns: ["src/business-logic/"] },
      { name: "Object Model", patterns: ["src/object-model/"] },
    ],
  },
];

function testCase(
  name: string,
  path: string,
  code: string
): RuleTester.ValidTestCase {
  return {
    name,
    filename: path,
    code,
    options,
    parserOptions: {
      ecmaVersion: 2015,
      sourceType: "module",
    },
  };
}

function invalidTestCase(
  name: string,
  path: string,
  code: string
): RuleTester.InvalidTestCase {
  return {
    ...testCase(name, path, code),
    errors: [{ messageId: "forbiddenImport" }],
  };
}

new RuleTester().run("onion-imports", onionImportsRule, {
  valid: [
    testCase(
      "import from outside of layers",
      "src/main.js",
      `
              import foo from "./ui/foo";
              import bar from "./data-access/bar";
              import baz from "./business-logic/bar";
              import qux from "./object-model/qux";
            `
    ),
    testCase(
      "import from same layer",
      "src/ui/foo.js",
      `
              import bar from "./bar";
              import baz from "../ui/baz";
            `
    ),
    testCase(
      "import from inner layer",
      "src/io/foo.js",
      `
              import bar from "./data-access/bar";
              import baz from "./business-logic/bar";
              import qux from "./object-model/qux";
            `
    ),
    testCase(
      "export from inner layer",
      "src/main.js",
      `
              export { bar } from "./data-access/bar";
              export { baz } from "./business-logic/bar";
              export { qux } from "./object-model/qux";
            `
    ),
  ],
  invalid: [
    invalidTestCase(
      "import from outer layer",
      "src/business-logic/foo.js",
      'import bar from "../ui/bar.js";'
    ),
    invalidTestCase(
      "import from same layer",
      "src/data-access/foo.js",
      'import bar from "../ui/bar.js";'
    ),
    invalidTestCase(
      "export from outer layer",
      "src/business-logic/foo.js",
      'export { bar } from "../ui/bar.js";'
    ),
    invalidTestCase(
      "export from same layer",
      "src/data-access/foo.js",
      'import { bar } from "../ui/bar.js";'
    ),
  ],
});