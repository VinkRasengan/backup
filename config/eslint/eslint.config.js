import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      // === MAINTAINABILITY RULES ===
      'complexity': ['warn', 10], // Giới hạn độ phức tạp của function
      'max-depth': ['warn', 4], // Giới hạn độ sâu của nested blocks
      'max-lines': ['warn', 300], // Giới hạn số dòng trong một file
      'max-lines-per-function': ['warn', 50], // Giới hạn số dòng trong một function
      'max-params': ['warn', 5], // Giới hạn số parameter
      'max-statements': ['warn', 20], // Giới hạn số statement trong function
      
      // === NAMING CONVENTIONS ===
      'camelcase': ['error', { 'properties': 'never' }],
      'id-length': ['warn', { 'min': 2, 'max': 30 }],
      
      // === MODERN JAVASCRIPT ===
      'no-var': 'error', // Sử dụng const/let thay vì var
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'arrow-spacing': 'warn',
      'no-confusing-arrow': 'error',
      
      // === DESTRUCTURING & TEMPLATE LITERALS ===
      'prefer-destructuring': ['warn', { 'array': true, 'object': true }],
      'prefer-template': 'warn',
      'template-curly-spacing': 'warn',
      'no-useless-concat': 'error',
      
      // === CODE STRUCTURE ===
      'no-else-return': 'warn',
      'no-nested-ternary': 'error',
      
      // === ERROR HANDLING ===
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      
      // === FORMATTING ===
      'no-multiple-empty-lines': ['warn', { 'max': 2 }],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      'comma-dangle': ['warn', 'never'],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'comma-spacing': 'warn',
      'quotes': ['warn', 'single', { 'avoidEscape': true }],
      'indent': ['warn', 2, { 'SwitchCase': 1 }],
      'no-mixed-spaces-and-tabs': 'error',
      
      // === FUNCTION STYLE ===
      'func-style': ['warn', 'expression'],
      'no-loop-func': 'error',
      
      // === VARIABLE USAGE ===
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-use-before-define': 'error',
      
      // === OBJECT & ARRAY ===
      'object-shorthand': 'warn',
      'no-array-constructor': 'error',
      'array-callback-return': 'warn',
      'no-new-object': 'error',
      
      // === COMPARISONS ===
      'eqeqeq': 'error',
      'curly': 'error',
      
      // === OTHER ===
      'no-empty': ['error', { 'allowEmptyCatch': true }],
      'no-extra-semi': 'error',
      'no-redeclare': 'error',
      'no-unused-expressions': 'error',
      'spaced-comment': 'warn',
      'multiline-comment-style': 'warn',
      'no-await-in-loop': 'warn'
    }
  },
  {
    // Override cho test files
    files: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**/*.js'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    // Override cho script files
    files: ['scripts/**/*.js', '**/*.script.js'],
    rules: {
      'no-console': 'off',
      'no-process-exit': 'off',
      'max-lines': 'off'
    }
  },
  {
    // Override cho client files
    files: ['client/**/*.js', 'client/**/*.jsx'],
    languageOptions: {
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // React globals
        React: 'readonly',
        useState: 'readonly',
        useEffect: 'readonly',
        useContext: 'readonly',
        useReducer: 'readonly',
        useCallback: 'readonly',
        useMemo: 'readonly',
        useRef: 'readonly',
        useImperativeHandle: 'readonly',
        useLayoutEffect: 'readonly',
        useDebugValue: 'readonly'
      }
    }
  }
];
