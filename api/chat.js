// Vercel Serverless Function for Chat API
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

  // Handle different chat endpoints
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (pathname === '/api/chat/message') {
    return handleSendMessage(req, res);
  } else if (pathname === '/api/chat/starters') {
    return handleGetStarters(req, res);
  } else if (pathname === '/api/chat/conversations') {
    return handleGetConversations(req, res);
  }
  
  return res.status(404).json({ error: 'Endpoint not found' });
}

// Handle send message
async function handleSendMessage(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try OpenAI API first
    try {
      const openaiResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      if (openaiResponse.ok) {
        const result = await openaiResponse.json();
        return res.status(200).json(result);
      }
    } catch (error) {
      console.log('OpenAI API fallback to mock');
    }

    // Fallback to enhanced mock
    const { enhancedMockChat } = await import('../client/src/services/enhancedMockChat.js');
    const mockResponse = enhancedMockChat.getResponse(message);
    
    return res.status(200).json({
      data: {
        message: 'Tin nhắn đã được gửi thành công',
        response: {
          content: mockResponse,
          createdAt: new Date().toISOString(),
          source: 'mock'
        }
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle get conversation starters
async function handleGetStarters(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const starters = [
    "Làm thế nào để nhận biết email lừa đảo?",
    "Cách tạo mật khẩu mạnh và an toàn?",
    "Phần mềm diệt virus nào tốt nhất?",
    "Cách bảo vệ thông tin cá nhân trên mạng?",
    "Dấu hiệu nhận biết website giả mạo?",
    "Cách bảo mật tài khoản mạng xã hội?",
    "Phải làm gì khi bị hack tài khoản?",
    "Cách kiểm tra link có an toàn không?"
  ];

  return res.status(200).json({
    data: {
      starters: starters
    }
  });
}

// Handle get conversations
async function handleGetConversations(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock conversations for now
  return res.status(200).json({
    data: {
      conversations: [],
      pagination: {
        currentPage: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  });
}
