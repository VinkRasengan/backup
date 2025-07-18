# Jest Configuration Fixes for ES Modules

## Problem
Jest was failing to parse ES modules from dependencies like axios, causing syntax errors:
```
SyntaxError: Cannot use import statement outside a module
```

## Fixes Applied

### 1. Updated package.json Jest Configuration
- Added `transformIgnorePatterns` to transform ES modules from node_modules
- Added `moduleNameMapper` for path aliases and CSS imports
- Added `testTimeout` for longer-running tests
- Added required devDependencies

### 2. Enhanced setupTests.js
- Added comprehensive mocks for axios, framer-motion, and other ES modules
- Improved Firebase and other service mocks
- Added proper polyfills for test environment

### 3. Created Babel Configuration
- Added `.babelrc` with proper presets for test environment
- Configured to transform ES modules to CommonJS for Jest

### 4. Added Missing Dependencies
- `identity-obj-proxy`: For CSS module mocking
- `jest-transform-stub`: For asset mocking

## Files Modified
- ✅ `client/package.json` - Updated Jest config and dependencies
- ✅ `client/src/setupTests.js` - Enhanced mocks
- ✅ `client/.babelrc` - Added Babel configuration
- ✅ `client/run-tests.js` - Created test runner script

## How to Run Tests

### Option 1: Standard npm test
```bash
cd client
npm test
```

### Option 2: Custom test runner (recommended)
```bash
cd client
node run-tests.js
```

### Option 3: Install missing dependencies first
```bash
cd client
npm install identity-obj-proxy jest-transform-stub --save-dev
npm test
```

## Expected Results
After applying these fixes:
- ✅ Jest should properly parse ES modules
- ✅ Tests should run without syntax errors
- ✅ Coverage reports should generate correctly
- ✅ All mocks should work properly

## Test Configuration Summary

The Jest configuration now includes:
```json
{
  "transformIgnorePatterns": [
    "node_modules/(?!(axios|@tanstack|framer-motion|lucide-react|gsap)/)"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
  "testEnvironment": "jsdom",
  "testTimeout": 10000
}
```

## Troubleshooting

If tests still fail:
1. Clear Jest cache: `npx jest --clearCache`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check that all dependencies are installed
4. Verify Babel configuration is correct

## Next Steps
1. Install missing dependencies if needed
2. Run tests to verify fixes
3. Add more test coverage as needed
4. Consider adding test scripts for CI/CD
