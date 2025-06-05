# OpenAI Integration Guide - FactCheck Platform

## 🎯 Tổng quan

Hệ thống đã được chuẩn bị sẵn sàng để tích hợp OpenAI API thật. Hiện tại đang chạy với mock responses thông minh, và có thể chuyển sang OpenAI thật chỉ với vài bước đơn giản.

## 🚀 Trạng thái hiện tại

### ✅ Đã hoàn thành:
- **Frontend**: Deploy thành công tại https://factcheck-1d6e8.web.app
- **Mock API**: Hoạt động với responses thông minh về bảo mật
- **OpenAI Service**: Code đã sẵn sàng trong Firebase Functions
- **Fallback System**: Tự động chuyển sang mock khi API fail
- **Authentication**: Firebase Auth hoạt động hoàn hảo

### 🔄 Cần thực hiện:
- Upgrade Firebase project lên Blaze plan
- Deploy Firebase Functions với OpenAI API key
- Cấu hình production environment

## 📋 Các bước tích hợp OpenAI

### Bước 1: Upgrade Firebase Project

1. **Truy cập Firebase Console**:
   ```
   https://console.firebase.google.com/project/factcheck-1d6e8/usage/details
   ```

2. **Upgrade lên Blaze Plan**:
   - Click "Modify plan"
   - Chọn "Blaze (Pay as you go)"
   - Thêm payment method
   - Confirm upgrade

### Bước 2: Lấy OpenAI API Key

1. **Truy cập OpenAI Platform**:
   ```
   https://platform.openai.com/api-keys
   ```

2. **Tạo API Key mới**:
   - Click "Create new secret key"
   - Đặt tên: "FactCheck-Production"
   - Copy API key (bắt đầu với sk-...)

3. **Thêm credit vào tài khoản**:
   - Vào Billing → Add payment method
   - Thêm tối thiểu $5 credit

### Bước 3: Cấu hình Firebase Functions

```bash
# Set OpenAI API key
firebase functions:config:set openai.api_key="sk-your-real-openai-api-key"

# Verify config
firebase functions:config:get

# Deploy functions
firebase deploy --only functions
```

### Bước 4: Cập nhật Frontend API URL

Sửa file `client/.env.production`:
```env
REACT_APP_API_URL=https://us-central1-factcheck-1d6e8.cloudfunctions.net/api
REACT_APP_USE_EMULATOR=false
```

### Bước 5: Build và Deploy Frontend

```bash
cd client
npm run build
firebase deploy --only hosting
```

## 🧪 Testing

### Test OpenAI Integration:

```bash
# Test functions locally
cd functions
node test-openai.js

# Test production API
node ../test-production-chat.js
```

### Test trong Browser:

1. Truy cập https://factcheck-1d6e8.web.app/chat
2. Đăng nhập với tài khoản
3. Gửi tin nhắn test: "Cách nhận biết phishing?"
4. Kiểm tra response từ OpenAI

## 🔧 Cấu hình OpenAI Service

### Các tham số có thể tùy chỉnh:

```javascript
// functions/services/openaiService.js
class OpenAIService {
  constructor() {
    this.model = 'gpt-3.5-turbo';        // Model sử dụng
    this.maxTokens = 500;                // Độ dài response tối đa
    this.temperature = 0.7;              // Độ sáng tạo (0-1)
  }
}
```

### System Prompt:

OpenAI được cấu hình với system prompt chuyên về bảo mật:
- Chuyên gia bảo mật mạng
- Trả lời bằng tiếng Việt
- Tập trung vào phòng chống lừa đảo
- Cung cấp lời khuyên thực tế

## 💰 Chi phí ước tính

### OpenAI API Pricing (GPT-3.5-turbo):
- **Input**: $0.0015 / 1K tokens
- **Output**: $0.002 / 1K tokens

### Ước tính sử dụng:
- **1 tin nhắn**: ~150 tokens input + 200 tokens output = ~$0.0007
- **1000 tin nhắn/tháng**: ~$0.70
- **10,000 tin nhắn/tháng**: ~$7.00

### Firebase Functions:
- **Free tier**: 2M invocations/month
- **Paid**: $0.40 / 1M invocations

## 🛡️ Bảo mật & Giới hạn

### Rate Limiting:
```javascript
// Có thể thêm rate limiting
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many chat requests, please try again later.'
});

app.use('/chat/message', chatLimiter);
```

### Content Filtering:
- OpenAI có built-in content filtering
- Chỉ trả lời câu hỏi về bảo mật
- Từ chối các chủ đề không liên quan

## 🔄 Fallback System

Hệ thống tự động fallback khi:
- OpenAI API không khả dụng
- Hết quota
- Network error
- Rate limit exceeded

Fallback responses được tối ưu cho các chủ đề bảo mật phổ biến.

## 📊 Monitoring & Logs

### Firebase Functions Logs:
```bash
firebase functions:log
```

### Metrics theo dõi:
- Response time
- Success rate
- Token usage
- Error rate
- User engagement

## 🚀 Production Checklist

- [ ] Firebase project upgraded to Blaze plan
- [ ] OpenAI API key configured
- [ ] Functions deployed successfully
- [ ] Frontend updated with Functions URL
- [ ] Testing completed
- [ ] Monitoring setup
- [ ] Rate limiting configured
- [ ] Error handling verified

## 🎉 Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Chat AI thông minh với OpenAI GPT-3.5-turbo
- ✅ Responses chuyên nghiệp về bảo mật
- ✅ Conversation history với context
- ✅ Fallback system đáng tin cậy
- ✅ Production-ready scalability

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Firebase Functions logs
2. Verify OpenAI API key và billing
3. Test với mock responses trước
4. Kiểm tra network connectivity

**Website hiện tại**: https://factcheck-1d6e8.web.app (với mock AI)
**Sau khi tích hợp**: Sẽ có OpenAI thật với responses chất lượng cao!
