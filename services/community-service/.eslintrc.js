module.exports = {
  'env': {
    'browser': false,
    'commonjs': true,
    'es6': true,
    'node': true
  },
  'extends': ['eslint:recommended'],
  'parserOptions': {
    'ecmaVersion': 2020
  },
  'rules': {
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-octal-escape': 'error',
    
    // Best practices for Node.js security - but allow for service configuration
    'no-process-env': 'off', // Allow process.env for service configuration
    'no-process-exit': 'off', // Allow process.exit in main service files
    'no-console': 'off', // Allow console for service logging
    
    // General code quality
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    
    // Async/await
    'no-async-promise-executor': 'error',
    'require-atomic-updates': 'error'
  },
  'globals': {
    'process': 'readonly',
    'Buffer': 'readonly',
    'console': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly'
  }
};
