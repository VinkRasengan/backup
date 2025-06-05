# VirusTotal API Integration

## Tổng quan

Tích hợp VirusTotal API vào hệ thống anti-fraud để cung cấp phân tích bảo mật URL và domain. Tính năng này giúp phát hiện các mối đe dọa như malware, phishing, và các trang web độc hại khác.

## Tính năng mới

### 1. URL Security Scanning
- Quét URL để phát hiện malware, phishing
- Phân tích reputation của domain
- Cung cấp điểm số bảo mật từ 0-100

### 2. Enhanced Scoring System
- **Credibility Score**: Điểm tin cậy nội dung (0-100)
- **Security Score**: Điểm bảo mật từ VirusTotal (0-100)
- **Final Score**: Điểm tổng hợp (60% credibility + 40% security)

### 3. Threat Detection
- Phát hiện các loại mối đe dọa: Malware, Phishing, Suspicious Content
- Hiển thị chi tiết từ các engine bảo mật
- Cảnh báo người dùng về các rủi ro tiềm ẩn

## Cấu hình

### 1. Lấy VirusTotal API Key

1. Truy cập [VirusTotal](https://www.virustotal.com/)
2. Đăng ký tài khoản miễn phí
3. Vào **Profile** → **API Key**
4. Copy API key

### 2. Cấu hình Environment Variables

Thêm vào file `server/.env`:

```env
# VirusTotal API Configuration
VIRUSTOTAL_API_KEY=your-virustotal-api-key-here
VIRUSTOTAL_API_URL=https://www.virustotal.com/api/v3
```

### 3. Rate Limiting

**Free Tier**: 4 requests/minute
**Premium**: Tùy theo gói đăng ký

Service tự động xử lý rate limiting với delay 15 giây giữa các request.

## Cách sử dụng

### 1. API Endpoint

```javascript
POST /api/links/check
{
  "url": "https://example.com"
}
```

### 2. Response Format

```javascript
{
  "message": "Link checked successfully",
  "result": {
    "id": "link-id",
    "url": "https://example.com",
    "status": "completed",
    "credibilityScore": 75,
    "securityScore": 85,
    "finalScore": 79,
    "summary": "Kết quả phân tích...",
    "metadata": {
      "title": "Page Title",
      "domain": "example.com",
      "publishDate": "2024-01-01T00:00:00.000Z",
      "author": "Author Name"
    },
    "security": {
      "threats": {
        "malicious": false,
        "suspicious": false,
        "threatNames": []
      },
      "urlAnalysis": {
        "success": true,
        "stats": {
          "malicious": 0,
          "suspicious": 0,
          "harmless": 5,
          "undetected": 2
        }
      },
      "domainAnalysis": {
        "success": true,
        "reputation": 1
      }
    }
  }
}
```

### 3. Frontend Display

Giao diện hiển thị:
- **Kết quả tổng quan**: Status và điểm số tổng hợp
- **Phân tích bảo mật**: Điểm bảo mật và trạng thái threats
- **Chi tiết bảo mật**: Thống kê từ các engine, thông tin domain
- **Cảnh báo**: Hiển thị các mối đe dọa được phát hiện

## Xử lý lỗi

### 1. API Key không hợp lệ
```javascript
{
  "success": false,
  "error": "Invalid API key"
}
```

### 2. Rate limit exceeded
Service tự động retry sau delay time.

### 3. URL chưa được scan
Service tự động trigger scan và trả về:
```javascript
{
  "success": true,
  "needsScanning": true,
  "scanTriggered": true,
  "analysisId": "analysis-id"
}
```

## Bảo mật

### 1. API Key Protection
- Lưu trữ trong environment variables
- Không commit vào source code
- Sử dụng HTTPS cho tất cả requests

### 2. Rate Limiting
- Implement client-side rate limiting
- Cache kết quả để giảm API calls
- Fallback khi service không available

## Monitoring

### 1. Logs
Service ghi log:
- API requests/responses
- Rate limiting events
- Error conditions

### 2. Metrics
Track:
- API usage quota
- Response times
- Success/error rates

## Troubleshooting

### 1. Service không hoạt động
- Kiểm tra API key trong `.env`
- Verify network connectivity
- Check VirusTotal service status

### 2. Kết quả không chính xác
- URL có thể chưa được scan
- Trigger manual scan qua VirusTotal web interface
- Wait và retry sau vài phút

### 3. Rate limit issues
- Upgrade to premium plan
- Implement better caching
- Reduce scan frequency

## Tài liệu tham khảo

- [VirusTotal API Documentation](https://developers.virustotal.com/reference)
- [VirusTotal Public API](https://support.virustotal.com/hc/en-us/articles/115002100149)
- [Rate Limiting Guidelines](https://support.virustotal.com/hc/en-us/articles/115002118525)
