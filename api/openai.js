// Vercel Serverless Function for OpenAI API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Bạn là FactCheck AI - chuyên gia bảo mật mạng và phân tích mối đe dọa trực tuyến hàng đầu Việt Nam.

NHIỆM VỤ:
- Trả lời các câu hỏi về bảo mật mạng, phishing, malware, lừa đảo trực tuyến
- Phân tích và đánh giá độ tin cậy của website, link, email
- Đưa ra lời khuyên bảo mật thực tế và dễ hiểu
- Hướng dẫn cách nhận biết và phòng chống các mối đe dọa

PHONG CÁCH:
- Trả lời bằng tiếng Việt
- Ngắn gọn, súc tích (tối đa 300 từ)
- Thân thiện nhưng chuyên nghiệp
- Sử dụng emoji phù hợp để làm nổi bật
- Đưa ra các bước cụ thể khi cần thiết

LĨNH VỰC CHUYÊN MÔN:
🔒 Bảo mật mạng & An toàn thông tin
🎣 Phishing & Social Engineering  
🦠 Malware & Virus
💳 Lừa đảo tài chính trực tuyến
🌐 An toàn website & URL
📧 Bảo mật email
📱 An toàn thiết bị di động`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const result = await openaiResponse.json();
    
    return res.status(200).json({
      data: {
        message: 'Phản hồi từ FactCheck AI',
        response: {
          content: result.choices[0].message.content,
          createdAt: new Date().toISOString(),
          source: 'openai'
        }
      }
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Fallback to enhanced mock response
    const { enhancedMockChat } = await import('../client/src/services/enhancedMockChat.js');
    const mockResponse = enhancedMockChat.getResponse(req.body.message);
    
    return res.status(200).json({
      data: {
        message: 'Phản hồi từ FactCheck AI (Offline Mode)',
        response: {
          content: mockResponse,
          createdAt: new Date().toISOString(),
          source: 'mock'
        }
      }
    });
  }
}
