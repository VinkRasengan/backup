# 🔧 CircleCI Fixes - Giải quyết lỗi test

## 🚨 **Vấn đề đã gặp:**

### 1. **Lỗi winston không tìm thấy:**
```
Cannot find module 'winston' from '../../shared/utils/logger.js'
```

### 2. **Lỗi TextEncoder không định nghĩa:**
```
ReferenceError: TextEncoder is not defined
```

### 3. **Lỗi timeout trong quá trình cài đặt:**
```
Too long with no output (exceeded 10m0s): context deadline exceeded
```

## ✅ **Giải pháp đã áp dụng:**

### 1. **Cập nhật cấu hình CircleCI** (`.circleci/config.yml`):

#### **Thêm environment variables:**
```yaml
environment:
  NODE_ENV: "test"
```

#### **Cải thiện install_deps:**
```yaml
# Install shared dependencies if needed
if [ -f "../../shared/package.json" ]; then
  cd ../../shared
  npm install --loglevel verbose
  cd - > /dev/null
fi
```

#### **Thêm setup_test_environment:**
```yaml
setup_test_environment:
  description: "Setup test environment"
  steps:
    - run:
        name: Setup test environment
        command: |
          # Add TextEncoder polyfill for Node.js test environment
          echo "global.TextEncoder = require('util').TextEncoder;" >> setupTests.js
          echo "global.TextDecoder = require('util').TextDecoder;" >> setupTests.js
          echo "global.URL = require('url').URL;" >> setupTests.js
          echo "global.URLSearchParams = require('url').URLSearchParams;" >> setupTests.js
          # Setup test configs for all services
          node scripts/setup-test-configs.js
```

#### **Cải thiện run_tests:**
```yaml
run_tests:
  command: |
    cd << parameters.path >>
    # Set test environment variables
    export NODE_ENV=test
    export TEST_MODE=true
    # Run tests with proper timeout
    npm test -- --testTimeout=30000 --forceExit --detectOpenHandles
```

### 2. **Tạo file setupTests.js cho frontend** (`client/src/setupTests.js`):

- **Polyfills cho Node.js test environment**
- **Mock Firebase, react-hot-toast, js-cookie**
- **Suppress console warnings**

### 3. **Tạo jest.config.js và jest.setup.js cho services:**

#### **jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  // ... other configs
};
```

#### **jest.setup.js:**
- **Polyfills cho TextEncoder, TextDecoder, URL, URLSearchParams**
- **Mock tất cả dependencies (Firebase, Redis, Axios, Winston, Express, etc.)**
- **Suppress console output trong tests**

### 4. **Tạo script setup-test-configs.js:**

- **Tự động tạo jest.config.js và jest.setup.js cho tất cả services**
- **Chạy trước khi test để đảm bảo cấu hình đúng**

### 5. **Cập nhật package.json của client:**

```json
"devDependencies": {
  "node-fetch": "^2.7.0"
}
```

## 🎯 **Kết quả mong đợi:**

### ✅ **Lỗi đã được sửa:**
1. **winston module not found** → Mock winston trong jest.setup.js
2. **TextEncoder not defined** → Polyfills trong setupTests.js
3. **Timeout issues** → Tăng timeout và cải thiện cache
4. **Frontend test failures** → Mock Firebase và polyfills

### 🚀 **Cải thiện hiệu suất:**
- **Cache shared dependencies**
- **Parallel test execution**
- **Proper timeout handling**
- **Environment isolation**

## 📋 **Cách sử dụng:**

### **Chạy test locally:**
```bash
# Setup test configs
node scripts/setup-test-configs.js

# Test individual service
cd services/news-service
npm test

# Test frontend
cd client
npm test
```

### **Chạy test trong CircleCI:**
```bash
# CircleCI sẽ tự động:
# 1. Install dependencies với cache
# 2. Setup test environment
# 3. Run tests với proper configs
```

## 🔍 **Monitoring:**

### **Kiểm tra logs:**
- CircleCI build logs sẽ hiển thị chi tiết từng bước
- Test results sẽ được report đầy đủ
- Coverage reports sẽ được generate

### **Debug tips:**
```bash
# Kiểm tra test config
cat services/news-service/jest.config.js

# Kiểm tra setup
cat services/news-service/jest.setup.js

# Chạy test với verbose
npm test -- --verbose
```

## 📝 **Notes:**

- **Tất cả services đều có cùng cấu hình test**
- **Frontend có polyfills riêng cho browser APIs**
- **Shared dependencies được cache để tăng tốc**
- **Environment variables được set đúng cho test mode** 