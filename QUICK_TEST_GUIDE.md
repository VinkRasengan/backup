# Quick Test Guide - VirusTotal Integration

## Chuẩn bị

### 1. Cấu hình VirusTotal API Key

1. Truy cập [VirusTotal](https://www.virustotal.com/)
2. Đăng ký tài khoản miễn phí
3. Lấy API key từ Profile → API Key
4. Thêm vào `server/.env`:

```env
VIRUSTOTAL_API_KEY=your-actual-api-key-here
```

### 2. Khởi động ứng dụng

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend  
cd client
npm install
npm start
```

## Test Cases

### 1. Test URL An toàn

**URL để test**: `https://google.com`

**Kết quả mong đợi**:
- Security Score: 80-100
- Status: An toàn (màu xanh)
- Không có threat được phát hiện
- Domain reputation: Tốt

### 2. Test URL Đáng ngờ

**URL để test**: `http://malware.testing.google.test/testing/malware/`

**Kết quả mong đợi**:
- Security Score: 30-60
- Status: Đáng ngờ (màu vàng)
- Có thể có một số detection
- Cảnh báo về rủi ro

### 3. Test URL Độc hại (Test domain)

**URL để test**: `http://eicar.org/download/eicar.com.txt`

**Kết quả mong đợi**:
- Security Score: 0-30
- Status: Nguy hiểm (màu đỏ)
- Nhiều engine phát hiện malware
- Hiển thị cảnh báo bảo mật

### 4. Test URL Chưa được scan

**URL để test**: `https://your-new-domain-never-scanned.com`

**Kết quả mong đợi**:
- Trigger scan tự động
- Hiển thị thông báo "đang phân tích"
- Có thể cần scan lại sau vài phút

## Kiểm tra Frontend

### 1. Giao diện mới

✅ **Kết quả tổng quan**: Hiển thị điểm tổng hợp
✅ **Phân tích bảo mật**: Card riêng cho security analysis
✅ **Chi tiết bảo mật**: Section mới với thống kê engines
✅ **Threat information**: Hiển thị các mối đe dọa được phát hiện

### 2. Thông tin hiển thị

- **Điểm tin cậy**: 0-100 (từ content analysis)
- **Điểm bảo mật**: 0-100 (từ VirusTotal)
- **Điểm tổng**: Weighted average (60% + 40%)
- **Engine stats**: Malicious/Suspicious/Harmless/Undetected
- **Domain reputation**: Tốt/Trung tính/Xấu
- **Threat names**: Danh sách các mối đe dọa

## Kiểm tra Backend

### 1. API Response

```bash
curl -X POST http://localhost:5000/api/links/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url": "https://google.com"}'
```

**Response mong đợi**:
```json
{
  "message": "Link checked successfully",
  "result": {
    "url": "https://google.com",
    "credibilityScore": 85,
    "securityScore": 95,
    "finalScore": 89,
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
      }
    }
  }
}
```

### 2. Logs kiểm tra

Trong console backend, kiểm tra:
```
Starting VirusTotal analysis for: https://google.com
VirusTotal rate limit: waiting 15000ms (nếu có)
```

## Troubleshooting

### 1. API Key không hoạt động

**Triệu chứng**: 
- Security score = null
- Error: "Invalid API key"

**Giải pháp**:
- Kiểm tra API key trong .env
- Verify key trên VirusTotal website
- Restart server sau khi thay đổi .env

### 2. Rate Limit

**Triệu chứng**:
- Requests chậm (15s delay)
- Console log: "VirusTotal rate limit: waiting..."

**Giải pháp**:
- Bình thường với free tier (4 requests/minute)
- Chờ hoặc upgrade premium account

### 3. URL chưa được scan

**Triệu chứng**:
- needsScanning: true
- scanTriggered: true

**Giải pháp**:
- Chờ vài phút và thử lại
- VirusTotal cần thời gian để scan URL mới

### 4. Network issues

**Triệu chứng**:
- Timeout errors
- Connection refused

**Giải pháp**:
- Kiểm tra internet connection
- Verify VirusTotal service status
- Check firewall/proxy settings

## Performance Notes

### Free Tier Limitations
- 4 requests/minute
- 500 requests/day
- 15.75K requests/month

### Optimization Tips
- Cache results để giảm API calls
- Implement exponential backoff
- Consider premium upgrade cho production

## Next Steps

1. **Production Setup**:
   - Get premium VirusTotal API key
   - Configure proper caching
   - Set up monitoring

2. **Enhanced Features**:
   - File upload scanning
   - Batch URL analysis
   - Historical trend analysis
   - Custom threat intelligence

3. **Integration**:
   - Webhook notifications
   - Third-party security tools
   - Automated reporting
