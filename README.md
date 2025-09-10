# eslint-plugin-no-code-after-never

Detects unreachable code after functions that return `never` using TypeScript type information.  
This plugin only relies on TypeScript types and does not use hardcoded function names.

## Installation

Install ESLint and the plugin as development dependencies:

```bash
npm install --save-dev eslint eslint-plugin-no-code-after-never typescript
```

## Usage

Add the plugin to your ESLint configuration:

```json
{
  "plugins": ["no-code-after-never"],
  "rules": {
    "no-code-after-never/no-code-after-never": "error"
  }
}
```

### Example

```ts
function fail(): never {
  throw new Error('This always fails');
}

function test() {
  fail();
  console.log('This line is unreachable'); // ESLint will report this
}
```

In this example, `console.log` will be reported as unreachable code because it follows a function that returns `never`.

## Rules

### `no-code-after-never`

Disallows unreachable code after functions that return `never`:

- **Type:** `problem`
- **Recommended:** `true`
- **Fixable:** No

**Message:**

```
Unreachable code after function that returns never: {{ functionName }}
```

## License

MIT
