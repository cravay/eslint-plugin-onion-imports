# Disallow imports from outer layers (onion-imports)

## Rule Details

This plugin helps to enforce import constraints according to the [Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/).

The examples use the following config:

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

Examples of **incorrect** code for this rule:

```js
// src/object-model/foo.js:
import bar from "../ui/bar.js";

// src/data-access/baz.js:
import qux from "../ui/qux.js";
```

Examples of **correct** code for this rule:

```js
// src/ui/foo.js:
import bar from "../business-logic/bar.js";

// src/business-logic/baz.js:
import qux from "../object-model/qux.js";
```

## Further Reading

- <https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/>
