# 📸 ScreenshotLayer API Integration

## 🎯 Overview

Tích hợp ScreenshotLayer API để chụp ảnh màn hình website trong tính năng kiểm tra link của FactCheck platform.

## 🔧 Implementation

### 1. **ScreenshotService** (`server/src/services/screenshotService.js`)

Service chính để tương tác với ScreenshotLayer API:

```javascript
const screenshotService = require('./services/screenshotService');

// Chụp ảnh màn hình cơ bản
const result = await screenshotService.takeScreenshot('https://example.com');

// Chụp ảnh màn hình mobile
const mobileResult = await screenshotService.takeMobileScreenshot('https://example.com');

// Chụ ảnh màn hình full page
const fullPageResult = await screenshotService.takeFullPageScreenshot('https://example.com');
```

### 2. **API Configuration**

Thêm vào `.env` file:

```env
# ScreenshotLayer API Configuration
SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key
```

### 3. **Integration với CrawlerService**

Screenshot được tích hợp vào quá trình kiểm tra link:

```javascript
// Trong crawlerService.js
const [virusTotalAnalysis, scamAdviserAnalysis, screenshotAnalysis] = await Promise.allSettled([
  virusTotalService.analyzeUrl(url),
  scamAdviserService.analyzeUrl(url),
  screenshotService.takeScreenshotWithRetry(url)
]);
```

## 📊 API Response Structure

### Response từ checkLink API:

```json
{
  "url": "https://example.com",
  "status": "completed",
  "screenshot": "http://api.screenshotlayer.com/api/capture?access_key=...&url=...",
  "screenshotInfo": {
    "success": true,
    "url": "http://api.screenshotlayer.com/api/capture?...",
    "fallback": false,
    "takenAt": "2025-06-08T04:33:45.793Z",
    "error": null
  },
  "thirdPartyResults": [...],
  "security": {...}
}
```

### Fallback Response (khi API key không có):

```json
{
  "screenshot": "https://via.placeholder.com/1280x720/f0f0f0/666666?text=example.com",
  "screenshotInfo": {
    "success": false,
    "url": "https://via.placeholder.com/1280x720/f0f0f0/666666?text=example.com",
    "fallback": true,
    "error": "ScreenshotLayer API key not configured"
  }
}
```

## 🧪 Testing

### 1. **Test API Endpoints**

```bash
# Test screenshot functionality
curl -X POST http://localhost:3000/api/test/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'

# Test full link check with screenshot
curl -X POST http://localhost:3000/api/test/check-link \
  -H "Content-Type: application/json" \
  -d '{"url":"https://facebook.com"}'
```

### 2. **Test Script**

```bash
node test-api.js
```

Output sẽ bao gồm:
- ✅ Screenshot test result
- 📸 Screenshot Info trong link check
- URL của screenshot

### 3. **Frontend Integration Test**

Mở `test-frontend-integration.html` để test:
- Screenshot hiển thị trong UI
- Fallback khi API không khả dụng
- Data structure validation

## 🔧 ScreenshotLayer API Features

### Default Options:
- **Width**: 1280px
- **Viewport**: 1280x1024
- **Format**: PNG
- **Delay**: 3 seconds (chờ page load)
- **TTL**: 30 days cache
- **User Agent**: Chrome desktop

### Mobile Screenshot:
- **Width**: 375px
- **Viewport**: 375x667 (iPhone)
- **User Agent**: Mobile Safari

### Full Page Screenshot:
- **Full Page**: Enabled
- **Width**: 1280px

## 🛡️ Error Handling

### 1. **Rate Limiting**
- 1 second delay giữa các requests
- Automatic retry với exponential backoff

### 2. **Fallback Strategy**
1. Try ScreenshotLayer API
2. If failed, return placeholder image
3. Log error for debugging

### 3. **Timeout Handling**
- 30 second timeout cho API calls
- Graceful degradation

## 📋 Frontend Integration

### CheckLinkPage.js

Screenshot được hiển thị trong section "Ảnh chụp màn hình":

```jsx
<img
  src={result.screenshot}
  alt="Website screenshot"
  className="w-full h-full object-cover"
  onError={(e) => {
    e.target.src = 'https://via.placeholder.com/400x300/f0f0f0/666666?text=No+Screenshot';
  }}
/>
```

## 🔗 API Documentation

ScreenshotLayer API Documentation: https://screenshotlayer.com/documentation

### Key Parameters:
- `access_key`: API key
- `url`: Target URL
- `width`: Screenshot width
- `viewport`: Browser viewport size
- `format`: PNG/JPG
- `fullpage`: 0/1 for full page
- `delay`: Seconds to wait before capture
- `ttl`: Cache time in seconds

## 🚀 Deployment

### Environment Variables:
```env
SCREENSHOTLAYER_API_KEY=your-api-key-here
```

### Health Check:
API key status được include trong `/api/health`:

```json
{
  "apis": {
    "screenshotlayer": true,
    "virustotal": true,
    "scamadviser": true
  }
}
```

## ✅ Status

- ✅ ScreenshotService implemented
- ✅ Integration với CrawlerService
- ✅ Test endpoints created
- ✅ Frontend integration ready
- ✅ Fallback mechanism working
- ✅ Error handling implemented
- ⏳ API key configuration needed

## 🔄 Next Steps

1. **Get ScreenshotLayer API Key**: Đăng ký tại https://screenshotlayer.com/
2. **Update .env**: Thêm API key thật
3. **Test Production**: Verify với real API key
4. **Monitor Usage**: Track API quota và performance
