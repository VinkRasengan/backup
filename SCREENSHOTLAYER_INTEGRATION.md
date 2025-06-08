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
- ✅ **API key configured và tested**
- ✅ **Screenshot generation working**
- ✅ **Multiple configurations tested**

## 🎯 Vấn đề Screenshot Đen - GIẢI QUYẾT

### ❌ Nguyên nhân chính:
1. **Delay không đủ** - Website cần thời gian load content
2. **User-Agent không phù hợp** - Một số site block bot requests
3. **Rate limiting** - Quá nhiều requests liên tiếp
4. **Cache issues** - Sử dụng cached screenshot cũ

### ✅ Giải pháp đã implement:

#### 1. **Enhanced Configuration**:
```javascript
{
  delay: 8,           // Tăng từ 3s lên 8s
  force: 1,           // Force fresh screenshot
  ttl: 300,           // Short cache (5 minutes)
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'
}
```

#### 2. **Multiple Retry Configurations**:
- **Config 1**: Standard desktop (1280x1024, 8s delay)
- **Config 2**: Mobile viewport (375x667, 6s delay)
- **Config 3**: Large desktop (1920x1080, 10s delay)

#### 3. **Rate Limiting Protection**:
- 1 second delay between requests
- 3 second wait between retries
- Exponential backoff

### 🧪 Test Results:

```
✅ google.com: 157,072 bytes - SUCCESS
✅ facebook.com: 38,821 bytes - SUCCESS
✅ github.com: 299,020 bytes - SUCCESS
✅ stackoverflow.com: 891,266 bytes - SUCCESS
✅ Mobile screenshot: 121,864 bytes - SUCCESS
✅ Full page screenshot: SUCCESS
```

## 🔄 Next Steps

1. ✅ **API Key Working**: ffcc32ae4590f0ac856092f3a7d08c3b
2. ✅ **Screenshots Generated**: All test URLs successful
3. ✅ **Integration Ready**: Service ready for production
4. 🔄 **Monitor Usage**: Track API quota và performance
