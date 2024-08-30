// module.exports = {
//   env: {
//     browser: true,
//     es2021: true,
//   },
//   extends: ["airbnb-base", "airbnb-typescript/base", "prettier",
//     "plugin:@typescript-eslint/eslint-recommended",
//     "plugin:@typescript-eslint/recommended",
//     "plugin:prettier/recommended",
//     "plugin:@typescript-eslint/strict"
//   ],
//   plugins: ["prettier", "@typescript-eslint"],
//   "overrides": [
//     {
//       "files": ["**/*.ts"] //ignore .js files
//     }
//   ],
//   parserOptions: {
//     ecmaVersion: "latest",
//     sourceType: "module",
//     project: "./tsconfig.json",
//     "createDefaultProgram": true

//   },
//   rules: {
//     "@typescript-eslint/no-use-before-define": "off",
//     "@typescript-eslint/no-shadow": "off",
//     "@typescript-eslint/no-throw-literal": "off",
//     "class-methods-use-this": "off",
//     "import/no-cycle": "off",
//     "import/prefer-default-export": "off",
//     "max-classes-per-file": "off",
//     "no-param-reassign": "off",
//     "no-underscore-dangle": "off",
//   },
//   ignorePatterns: [".eslintrc.js", "dist", "config"],
// };


module.exports = {
  "env": {
    "browser": false,
    "es6": true,
    "node": true,
    "jest": true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
        "ecmaVersion": "latest",
    "project": "tsconfig.json",
    "sourceType": "module",
    "createDefaultProgram": true
  },
  "overrides": [
    {
      "files": [
        "**/*.ts"
      ] //ignore .js files
    }
  ],
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/strict"
  ],
  "rules": {
    "@typescript-eslint/no-import-type-side-effects": "error",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports",
        "fixStyle": "separate-type-imports"
      }
    ],
    // "quotes": ["error", "double"],
    "object-curly-spacing": [
      "error",
      "always"
    ],
    "@typescript-eslint/consistent-type-definitions": [
      "warn",
      "type"
    ],
    "@typescript-eslint/explicit-function-return-type": "error",
    "no-var": "error",
    "padding-line-between-statements": [
      "error",
      {
        "blankLine": "always",
        "prev": "block-like",
        "next": "function"
      }
    ],
    "no-empty": "warn",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": {
          "arguments": false
        }
      }
    ],
    "semi": [
      "error",
      "always"
    ],
    "space-infix-ops": "error",
    "spaced-comment": "error",
    "arrow-spacing": "error",
    "eqeqeq": [
      "warn",
      "always"
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        "selector": "enum",
        "format": [
          "PascalCase"
        ]
      },
      {
        "selector": "enumMember",
        "format": [
          "UPPER_CASE"
        ]
      },
      {
        "selector": "class",
        "format": [
          "PascalCase"
        ]
      },
      {
        "selector": "interface",
        "format": [
          "PascalCase"
        ]
      },
      {
        "selector": "typeAlias",
        "format": [
          "PascalCase"
        ]
      },
      {
        "selector": "classProperty",
        "format": [
          "camelCase"
        ],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "objectLiteralProperty",
        "format": null
      },
      {
        "selector": "typeLike",
        "format": [
          "PascalCase",
          "camelCase"
        ]
      },
      {
        "selector": "variable",
        "modifiers": [
          "const"
        ],
        "format": [
          "UPPER_CASE",
          "camelCase"
        ],
        "filter": {
          "regex": "^_.*",
          "match": false
        }
      },
      {
        "selector": "variable",
        "modifiers": [
          "exported",
          "const"
        ],
        "format": [
          "UPPER_CASE",
          "camelCase"
        ]
      },
      {
        "selector": "default",
        "format": [
          "strictCamelCase"
        ],
        "leadingUnderscore": "allow"
      } //this must be the last rule
    ]
  },
    ignorePatterns: [".eslintrc.js", "dist", "config"],
}