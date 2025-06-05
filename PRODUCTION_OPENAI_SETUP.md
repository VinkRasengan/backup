# Production OpenAI Setup Guide

## 🎯 Mục tiêu

Bỏ mode offline/mock và chỉ sử dụng OpenAI API thật trên production website.

## ✅ Đã hoàn thành

### 1. Cập nhật API Service
- ✅ Bỏ fallback sang mock trong production
- ✅ Chỉ fallback trong development mode
- ✅ Error handling rõ ràng cho production

### 2. Cập nhật UI
- ✅ Bỏ thông báo "Demo Mode" 
- ✅ Chỉ hiển thị development notice trong dev mode
- ✅ Error messages chi tiết hơn

### 3. Cập nhật Firebase Functions
- ✅ OpenAI service với proper error handling
- ✅ Ít fallback hơn trong production
- ✅ Professional error messages

## 🚀 Các bước triển khai

### Bước 1: Lấy OpenAI API Key

1. **Truy cập OpenAI Platform**:
   ```
   https://platform.openai.com/api-keys
   ```

2. **Tạo API Key mới**:
   - Click "Create new secret key"
   - Đặt tên: "FactCheck-Production"
   - Copy API key (bắt đầu với sk-proj-...)

3. **Thêm billing**:
   - Vào Billing → Add payment method
   - Thêm tối thiểu $5 credit

### Bước 2: Test OpenAI API Key

```bash
# Test API key locally
node test-openai-production.js
```

**Thay thế API key trong script trước khi test!**

### Bước 3: Upgrade Firebase Project

1. **Truy cập Firebase Console**:
   ```
   https://console.firebase.google.com/project/factcheck-1d6e8/usage/details
   ```

2. **Upgrade lên Blaze Plan**:
   - Click "Modify plan"
   - Chọn "Blaze (Pay as you go)"
   - Thêm payment method
   - Confirm upgrade

### Bước 4: Deploy Firebase Functions

```bash
# Set OpenAI API key
firebase functions:config:set openai.api_key="sk-proj-your-real-api-key"

# Verify config
firebase functions:config:get

# Deploy functions
firebase deploy --only functions
```

### Bước 5: Deploy Frontend

```bash
cd client
npm run build
firebase deploy --only hosting
```

## 🔧 Cấu hình hiện tại

### API Fallback Logic:

```javascript
// Development: Fallback to mock when API fails
if (process.env.NODE_ENV === 'development') {
  return await mockCall();
}

// Production: Show proper error, no fallback
throw error;
```

### Error Messages:

- ✅ **401**: "Lỗi xác thực OpenAI API. Vui lòng kiểm tra API key."
- ✅ **429**: "Tài khoản OpenAI đã hết quota. Vui lòng kiểm tra billing."
- ✅ **400**: "Yêu cầu không hợp lệ. Vui lòng thử lại với tin nhắn khác."
- ✅ **500+**: "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau."

### UI Changes:

- ❌ Không còn "Demo Mode" notice
- ✅ Professional error handling
- ✅ Clear user feedback

## 📊 Monitoring

### Logs để theo dõi:

```bash
# Firebase Functions logs
firebase functions:log

# Filter OpenAI related logs
firebase functions:log --only openai
```

### Metrics quan trọng:

- **Success rate**: % requests thành công
- **Response time**: Thời gian phản hồi
- **Token usage**: Chi phí OpenAI
- **Error rate**: Tỷ lệ lỗi

## 💰 Chi phí ước tính

### OpenAI GPT-3.5-turbo:
- **Input**: $0.0015 / 1K tokens
- **Output**: $0.002 / 1K tokens
- **Ước tính**: ~$0.0007 per message

### Firebase Functions:
- **Free tier**: 2M invocations/month
- **Paid**: $0.40 / 1M invocations

### Tổng chi phí dự kiến:
- **1,000 messages/month**: ~$0.70
- **10,000 messages/month**: ~$7.00
- **100,000 messages/month**: ~$70.00

## 🛡️ Bảo mật

### API Key Security:
- ✅ Stored in Firebase Functions config
- ✅ Not exposed to frontend
- ✅ Environment-specific configuration

### Rate Limiting:
- OpenAI: Built-in rate limits
- Firebase: Function concurrency limits
- Frontend: User-based throttling

## 🧪 Testing Checklist

### Pre-deployment:
- [ ] OpenAI API key tested locally
- [ ] Firebase project upgraded to Blaze
- [ ] Functions config set correctly
- [ ] Build passes without errors

### Post-deployment:
- [ ] Chat functionality works
- [ ] Error messages are appropriate
- [ ] No fallback to mock responses
- [ ] Performance is acceptable

### Test Cases:
- [ ] Normal chat conversation
- [ ] Long messages (near token limit)
- [ ] Special characters and Vietnamese
- [ ] Error scenarios (invalid input)
- [ ] Rate limiting behavior

## 🚨 Troubleshooting

### Common Issues:

**"OpenAI API chưa được cấu hình"**:
- Check Firebase Functions config
- Verify API key is set correctly

**"Tài khoản OpenAI đã hết quota"**:
- Add billing to OpenAI account
- Check usage limits

**"Dịch vụ AI tạm thời không khả dụng"**:
- Check Firebase Functions logs
- Verify Functions are deployed
- Check OpenAI service status

**Network errors**:
- Check internet connection
- Verify Firebase project is active
- Check CORS configuration

## 📈 Success Metrics

### Target Goals:
- **Uptime**: >99% availability
- **Response time**: <5 seconds average
- **User satisfaction**: Professional responses
- **Cost efficiency**: <$0.001 per message

### Monitoring Tools:
- Firebase Console
- OpenAI Usage Dashboard
- Google Analytics (if integrated)
- User feedback

## 🎉 Expected Results

After successful deployment:

- ✅ **No more offline mode**
- ✅ **Real OpenAI responses**
- ✅ **Professional error handling**
- ✅ **Scalable architecture**
- ✅ **Cost-effective operation**

## 📞 Support

If issues occur:

1. **Check logs**: `firebase functions:log`
2. **Verify config**: `firebase functions:config:get`
3. **Test API key**: Run local test script
4. **Check billing**: OpenAI and Firebase accounts
5. **Review documentation**: This guide and OpenAI docs

---

**Ready for production OpenAI integration!** 🚀

Website: https://factcheck-1d6e8.web.app
Status: Waiting for Blaze plan upgrade and Functions deployment
