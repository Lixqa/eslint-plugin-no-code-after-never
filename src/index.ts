import noCodeAfterNever from './rules/no-code-after-never';

// Collect rules
export const rules = {
  'no-code-after-never': noCodeAfterNever,
};

// Export configs
export const configs = {
  recommended: {
    plugins: {
      'no-code-after-never': {
        rules,
      },
    },
    rules: {
      'no-code-after-never/no-code-after-never': 'error',
    },
  },
};

// Default export (plugin object)
export default {
  rules,
  configs,
};
