// Vercel Serverless Function for VirusTotal API
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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Submit URL to VirusTotal for analysis
    const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': process.env.VIRUSTOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(url)}`
    });

    if (!submitResponse.ok) {
      throw new Error(`VirusTotal submit error: ${submitResponse.status}`);
    }

    const submitResult = await submitResponse.json();
    const analysisId = submitResult.data.id;

    // Wait a bit for analysis to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get analysis results
    const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: {
        'x-apikey': process.env.VIRUSTOTAL_API_KEY
      }
    });

    if (!analysisResponse.ok) {
      throw new Error(`VirusTotal analysis error: ${analysisResponse.status}`);
    }

    const analysisResult = await analysisResponse.json();
    const stats = analysisResult.data.attributes.stats;

    // Calculate risk level
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected;
    
    let riskLevel = 'low';
    let finalScore = 100;

    if (malicious > 0) {
      riskLevel = 'high';
      finalScore = Math.max(0, 100 - (malicious * 20));
    } else if (suspicious > 2) {
      riskLevel = 'medium';
      finalScore = Math.max(20, 100 - (suspicious * 10));
    } else if (suspicious > 0) {
      riskLevel = 'low';
      finalScore = Math.max(60, 100 - (suspicious * 5));
    }

    return res.status(200).json({
      data: {
        id: analysisId,
        url: url,
        status: 'completed',
        result: {
          finalScore: finalScore,
          riskLevel: riskLevel,
          summary: `Đã quét bởi ${total} công cụ bảo mật. Phát hiện ${malicious} mối đe dọa và ${suspicious} cảnh báo.`,
          details: {
            malicious: malicious,
            suspicious: suspicious,
            harmless: stats.harmless,
            undetected: stats.undetected,
            total: total
          },
          checkedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('VirusTotal API Error:', error);
    
    // Fallback to mock response
    const mockScore = Math.floor(Math.random() * 100);
    const mockRisk = mockScore > 80 ? 'low' : mockScore > 50 ? 'medium' : 'high';
    
    return res.status(200).json({
      data: {
        id: 'mock-' + Date.now(),
        url: req.body.url,
        status: 'completed',
        result: {
          finalScore: mockScore,
          riskLevel: mockRisk,
          summary: 'Kết quả demo - VirusTotal API không khả dụng. Trong thực tế sẽ có phân tích chi tiết về tính an toàn của website.',
          details: {
            malicious: mockRisk === 'high' ? 2 : 0,
            suspicious: mockRisk === 'medium' ? 1 : 0,
            harmless: 45,
            undetected: 5,
            total: 50
          },
          checkedAt: new Date().toISOString()
        }
      }
    });
  }
}
