# GPT Chat Integration - Trợ lý Bảo mật AI

## Tổng quan

Tích hợp OpenAI GPT API để tạo một trợ lý AI chuyên về bảo mật mạng. Tính năng này chỉ dành cho người dùng đã đăng nhập và xác minh email.

## Tính năng chính

### 🤖 Trợ lý Bảo mật AI
- **Chuyên môn**: Bảo mật mạng, phishing, malware, mối đe dọa trực tuyến
- **Ngôn ngữ**: Tiếng Việt
- **Phong cách**: Chuyên nghiệp, thân thiện, ưu tiên an toàn

### 💬 Chat Interface
- **Real-time messaging**: Gửi/nhận tin nhắn tức thời
- **Conversation history**: Lưu trữ lịch sử cuộc trò chuyện
- **Multiple conversations**: Quản lý nhiều cuộc trò chuyện
- **Conversation starters**: Gợi ý câu hỏi ban đầu

### 🔐 Bảo mật & Kiểm soát
- **Authentication required**: Chỉ user đã login
- **Email verification**: Phải xác minh email
- **Input validation**: Kiểm tra nội dung tin nhắn
- **Content filtering**: Lọc nội dung có hại

## Cấu hình

### 1. OpenAI API Key

1. Truy cập [OpenAI Platform](https://platform.openai.com/)
2. Tạo tài khoản và lấy API key
3. Thêm vào `server/.env`:

```env
# OpenAI GPT API Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

### 2. Model Configuration

- **Model**: `gpt-3.5-turbo` (cost-effective) hoặc `gpt-4` (chất lượng cao hơn)
- **Max Tokens**: 500 (đủ cho câu trả lời chi tiết)
- **Temperature**: 0.7 (cân bằng giữa sáng tạo và chính xác)

### 3. System Prompt

Prompt được thiết kế để:
- Tập trung vào bảo mật mạng
- Trả lời bằng tiếng Việt
- Đưa ra lời khuyên thực tế
- Không hỗ trợ hoạt động có hại

## API Endpoints

### Chat Endpoints

```javascript
// Gửi tin nhắn
POST /api/chat/message
{
  "message": "Làm thế nào để nhận biết email phishing?",
  "conversationId": "optional-conversation-id"
}

// Lấy danh sách cuộc trò chuyện
GET /api/chat/conversations?page=1&limit=20

// Lấy chi tiết cuộc trò chuyện
GET /api/chat/conversations/:conversationId

// Xóa cuộc trò chuyện
DELETE /api/chat/conversations/:conversationId

// Lấy gợi ý câu hỏi
GET /api/chat/starters

// Lấy lời khuyên bảo mật
GET /api/chat/tips?category=phishing
```

### Response Format

```javascript
{
  "message": "Tin nhắn đã được gửi thành công",
  "conversation": {
    "id": "conversation-id",
    "title": "Tiêu đề cuộc trò chuyện"
  },
  "response": {
    "content": "Câu trả lời từ AI...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Frontend Components

### 1. ChatPage (`/chat`)
- **Layout**: Sidebar (conversations) + Main chat area
- **Features**: 
  - Conversation management
  - Real-time messaging
  - Message history
  - Conversation starters

### 2. Navigation
- **Menu item**: "Trợ lý AI" 
- **Icon**: MessageCircle
- **Access**: Chỉ user đã login

## Database Schema

### Conversations Collection
```javascript
{
  id: "auto-generated",
  userId: "user-id",
  title: "Conversation title",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  messageCount: 0,
  lastMessage: "Last user message"
}
```

### Chat Messages Collection
```javascript
{
  id: "auto-generated",
  conversationId: "conversation-id",
  userId: "user-id",
  role: "user" | "assistant",
  content: "Message content",
  createdAt: "ISO timestamp",
  metadata: {
    model: "gpt-3.5-turbo",
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30
    }
  }
}
```

## Validation & Security

### 1. Input Validation
- **Length**: 1-1000 ký tự
- **Content**: Lọc từ khóa có hại (hack, crack, exploit, etc.)
- **Rate limiting**: Tránh spam

### 2. Content Filtering
```javascript
const harmfulPatterns = [
  /hack/i, /crack/i, /exploit/i, 
  /ddos/i, /attack/i
];
```

### 3. Authentication
- JWT token required
- Email verification required
- User session validation

## Cost Management

### 1. Token Usage
- **Input**: ~50-100 tokens/message
- **Output**: ~200-400 tokens/response
- **Total**: ~300-500 tokens/conversation

### 2. Pricing (GPT-3.5-turbo)
- **Input**: $0.0015/1K tokens
- **Output**: $0.002/1K tokens
- **Average cost**: ~$0.001/message

### 3. Optimization
- Limit conversation history (10 messages)
- Set max_tokens limit
- Implement caching for common questions

## Error Handling

### 1. API Errors
```javascript
// 401 Unauthorized
"API key không hợp lệ"

// 429 Rate Limit
"Đã vượt quá giới hạn API"

// 400 Bad Request
"Yêu cầu không hợp lệ"

// General Error
"Có lỗi xảy ra khi xử lý yêu cầu"
```

### 2. Frontend Handling
- Toast notifications
- Retry mechanisms
- Graceful degradation

## Testing

### 1. Unit Tests
- OpenAI service tests
- Chat controller tests
- Validation tests

### 2. Integration Tests
- API endpoint tests
- Authentication tests
- Database operations

### 3. Manual Testing
```bash
# Test conversation starters
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/chat/starters

# Test message sending
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Cách nhận biết phishing?"}' \
  http://localhost:5000/api/chat/message
```

## Monitoring

### 1. Metrics to Track
- API usage (tokens/day)
- Response times
- Error rates
- User engagement

### 2. Logging
- API requests/responses
- Token usage
- Error conditions
- User interactions

## Deployment

### 1. Environment Variables
```env
OPENAI_API_KEY=sk-real-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

### 2. Production Considerations
- API key security
- Rate limiting
- Cost monitoring
- Performance optimization

## Troubleshooting

### 1. Common Issues

**API Key không hoạt động**
- Kiểm tra key trong .env
- Verify key trên OpenAI platform
- Check billing status

**Rate limit exceeded**
- Implement exponential backoff
- Consider upgrading plan
- Add request queuing

**High costs**
- Monitor token usage
- Optimize prompts
- Implement caching

### 2. Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG_OPENAI = 'true';
```

## Future Enhancements

### 1. Advanced Features
- Voice chat integration
- File upload analysis
- Custom security reports
- Integration with VirusTotal analysis

### 2. Performance
- Response caching
- Streaming responses
- Background processing

### 3. Analytics
- Usage analytics
- User satisfaction metrics
- Popular topics tracking
