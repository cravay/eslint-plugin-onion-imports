# eslint-plugin-onion-imports

[![CI](https://github.com/cravay/eslint-plugin-onion-imports/actions/workflows/ci.yml/badge.svg)](https://github.com/cravay/eslint-plugin-onion-imports/actions/workflows/ci.yml)

This plugin helps to enforce import constraints according to the [Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/).

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-onion-imports`:

```sh
npm install eslint-plugin-onion-imports --save-dev
```

## Usage

Add `onion-imports` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["onion-imports"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "onion-imports/onion-imports": [
      "warn",
      {
        "layers": [
          [
            { "name": "UI", "patterns": ["src/ui/"] },
            { "name": "Data Access", "patterns": ["src/data-access/"] }
          ],
          { "name": "Business Logic", "patterns": ["src/business-logic/"] },
          { "name": "Object Model", "patterns": ["src/object-model/"] }
        ]
      }
    ]
  }
}
```

## Supported Rules

- [onion-imports](./lib/rules/onion-imports.md)

## License

[MIT](./LICENSE)
