import type { Rule } from "eslint";
import type ESTree from "estree";
import ignore from "ignore";
import type { JSONSchema4 } from "json-schema";
import { dirname, join, relative } from "path";

interface Layer {
  name: string;
  patterns: string[];
}

// An Onion layer can either consist of a single layer or multiple
// parallel sub-layers
type ParallelLayers = Layer[];
type OnionLayer = Layer | ParallelLayers;

export interface OnionImportsRuleOptions {
  layers: OnionLayer[];
}

const layerSchema: JSONSchema4 = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    patterns: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 1,
    },
  },
  required: ["name", "patterns"],
  additionalProperties: false,
};

/**
 * Return whether a file belongs to a layer or not
 */
function pathBelongsToLayer(path: string, layer: Layer): boolean {
  return ignore({ ignoreCase: true }).add(layer.patterns).ignores(path);
}

/**
 * Returns the sub-layer a path belongs to or undefined
 */
function findSubLayer(path: string, layer: OnionLayer): Layer | undefined {
  if (Array.isArray(layer)) {
    return layer.find((subLayer) => pathBelongsToLayer(path, subLayer));
  }

  return pathBelongsToLayer(path, layer) ? layer : undefined;
}

/**
 * Returns the index of the layer and the sub-layer a path belongs to or undefined
 */
function findLayerAndSubLayer(
  path: string,
  layers: OnionLayer[]
): undefined | [number, Layer] {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const subLayer = findSubLayer(path, layer);

    if (subLayer) {
      return [i, subLayer];
    }
  }
}

/**
 * Relevant docs: https://eslint.org/docs/latest/developer-guide/working-with-rules
 */
const onionImportRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          layers: {
            type: "array",
            items: {
              anyOf: [
                layerSchema,
                { type: "array", items: layerSchema, minItems: 1 },
              ],
            },
            minItems: 2,
          },
        },
        required: ["layers"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 1,
    },
    docs: {
      description: "Enforce import rules for Onion Architecture",
      url: "https://github.com/cravay/eslint-plugin-onion-imports/blob/main/lib/rules/onion-imports.md",
    },
    messages: {
      forbiddenImport: `It's forbidden to import something from layer "{{otherLayer}}" in layer "{{currentLayer}}"`,
    },
  },

  /**
   * Create a rule listener for the onion imports rule.
   * Partially based on https://github.com/eslint/eslint/blob/main/lib/rules/no-restricted-imports.js
   */
  create(context) {
    const { layers }: OnionImportsRuleOptions = context.options[0];
    const cwd = context.getCwd();
    const path = relative(cwd, context.getFilename());
    const dir = dirname(path);

    // Get the layer of the current file
    const match = findLayerAndSubLayer(path, layers);

    // Abort if we're not inside of a layer
    if (!match) {
      return {};
    }

    const [currentLayerIndex, currentLayer] = match;

    /**
     * Check an import or export node and report violations to the onion import rules.
     */
    const checkNode = (
      node:
        | ESTree.ImportDeclaration
        | ESTree.ExportNamedDeclaration
        | ESTree.ExportAllDeclaration
    ): void => {
      // Try to get the path of the file being imported
      // Currently handling all paths as relative paths...
      const importPath = node.source?.value;

      if (typeof importPath !== "string") {
        return;
      }
      const relativeImportPath = relative(cwd, join(dir, importPath));

      // Check if the import path belongs to a different sub-layer
      // on the same layer or to an outer layer, which would
      // violate the onion import constraints
      for (let i = currentLayerIndex; i >= 0; i--) {
        const layer = layers[i];
        const otherLayer = findSubLayer(relativeImportPath, layer);

        if (otherLayer && otherLayer !== currentLayer) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: {
              currentLayer: currentLayer.name,
              otherLayer: otherLayer.name,
            },
          });
        }
      }
    };

    return {
      ImportDeclaration: checkNode,
      ExportNamedDeclaration: checkNode,
      ExportAllDeclaration: checkNode,
    };
  },
};

export default onionImportRule;
