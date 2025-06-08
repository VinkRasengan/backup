# ScamAdviser API Integration via RapidAPI

## Overview

This document describes the integration of ScamAdviser API via RapidAPI into the fact-checking platform's URL security analysis workflow.

## API Setup

### 1. RapidAPI Account Setup

1. Create an account at <https://rapidapi.com>
2. Navigate to ScamAdviser API: <https://rapidapi.com/scamadviser/api/scamadviser1>
3. Subscribe to the API (free tier available)
4. Copy your RapidAPI key from the dashboard

### 2. Environment Configuration

Add your RapidAPI key to the environment variables:

```bash
# ScamAdviser API Configuration (via RapidAPI)
SCAMADVISER_API_KEY=your-rapidapi-key-for-scamadviser
```

### 3. API Endpoints Used

- **Base URL**: `https://scamadviser1.p.rapidapi.com`
- **Endpoint**: `/v1/trust/single`
- **Method**: GET
- **Headers**:
  - `X-RapidAPI-Key`: Your RapidAPI key
  - `X-RapidAPI-Host`: scamadviser1.p.rapidapi.com

## Features Added

## Features Added

### Backend Integration

1. **ScamAdviser Service** (`server/src/services/scamAdviserService.js`)
   - Analyzes URLs/domains for trust score and scam risk
   - Provides risk level assessment (low, medium, high, very_high)
   - Extracts detailed risk factors and domain information
   - Handles API authentication and rate limiting
   - Provides fallback error handling

2. **Enhanced Crawler Service** (`server/src/services/crawlerService.js`)
   - Parallel execution of VirusTotal and ScamAdviser APIs
   - Combined security scoring algorithm
   - Enhanced summary generation with multi-source data
   - Modular architecture for easy maintenance

3. **API Routes** (`server/src/routes/scamAdviserRoutes.js`)
   - `/api/scamadviser/check` - Check URL with ScamAdviser
   - `/api/scamadviser/status` - Get ScamAdviser service status
   - Authentication required for API access

### Frontend Integration

1. **ScamAdviser Service** (`client/src/services/scamAdviserService.js`)
   - Frontend service for ScamAdviser API calls
   - Utility functions for formatting and display
   - Vietnamese language translations for risk factors

2. **Enhanced UI** (`client/src/pages/CheckLinkPage.js`)
   - Side-by-side display of VirusTotal and ScamAdviser results
   - Combined security assessment with detailed breakdowns
   - Risk factor visualization with translated descriptions
   - Improved security summary with multi-source analysis

## Security Scoring Algorithm

The platform now uses a weighted scoring approach:

1. **Individual Scores**:
   - VirusTotal: Malware and threat detection
   - ScamAdviser: Trust score and scam risk assessment

2. **Combined Security Score**:
   - VirusTotal weight: 60% (higher priority for malware detection)
   - ScamAdviser weight: 40% (trust and scam assessment)

3. **Final Score Calculation**:
   - Credibility: 60% (content analysis)
   - Security: 40% (combined VirusTotal + ScamAdviser)

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# ScamAdviser API Configuration
SCAMADVISER_API_KEY=your-scamadviser-api-key
```

### API Key Setup

1. Sign up at https://api.scamadviser.cloud/
2. Obtain your API key from the dashboard
3. Add the key to your environment variables
4. The service will automatically detect and use the API key

## API Response Structure

### ScamAdviser Response Format

```javascript
{
  success: true,
  trustScore: 85,           // 0-100 trust score
  riskLevel: 'low',         // low, medium, high, very_high
  details: {
    domain: 'example.com',
    country: 'Vietnam',
    registrationDate: '2023-01-01T00:00:00Z',
    ssl: true,
    socialMedia: true,
    reviews: 4,
    lastChecked: '2025-06-08T12:00:00Z'
  },
  riskFactors: [
    'Suspicious activity detected',
    'High phishing risk'
  ],
  analyzedAt: '2025-06-08T12:00:00Z'
}
```

### Enhanced Security Section

```javascript
{
  security: {
    virusTotal: {
      // VirusTotal data
      threats: { malicious: false, suspicious: false },
      urlAnalysis: { stats: {...} },
      securityScore: 85
    },
    scamAdviser: {
      // ScamAdviser data
      trustScore: 80,
      riskLevel: 'low',
      riskFactors: [],
      details: {...}
    },
    combinedScore: 83
  }
}
```

## Risk Level Mapping

| Trust Score | Risk Level | Description |
|-------------|------------|-------------|
| 80-100      | low        | Thấp - Đáng tin cậy |
| 60-79       | medium     | Trung bình - Cần thận trọng |
| 40-59       | high       | Cao - Có rủi ro |
| 0-39        | very_high  | Rất cao - Tránh truy cập |

## Error Handling

The integration includes comprehensive error handling:

1. **API Key Missing**: Service returns null data with appropriate error message
2. **Rate Limiting**: Automatic retry with backoff strategy
3. **Network Errors**: Graceful fallback to VirusTotal-only analysis
4. **Invalid Domains**: Domain extraction validation with error responses

## UI Features

### Security Analysis Section

- **Dual-panel layout**: VirusTotal and ScamAdviser side by side
- **Visual indicators**: Color-coded risk levels and trust scores
- **Detailed breakdowns**: Individual service results with explanations
- **Combined assessment**: Intelligent summary of both services

### Risk Factor Display

- **Translated labels**: Vietnamese translations for common risk factors
- **Visual icons**: Alert triangles and status indicators
- **Contextual information**: Domain details and registration info

## Performance Considerations

1. **Parallel API Calls**: VirusTotal and ScamAdviser run simultaneously
2. **Rate Limiting**: Configurable delays to respect API limits
3. **Timeout Handling**: 30-second timeout for API calls
4. **Fallback Strategy**: Graceful degradation when one service fails

## Testing

The integration includes comprehensive mock data for testing without API keys:

```javascript
// Mock ScamAdviser response
const mockScamAdviserData = {
  trustScore: Math.floor(Math.random() * 100),
  riskLevel: trustScore >= 80 ? 'low' : 'medium',
  riskFactors: ['High phishing risk'],
  details: {
    domain: 'example.com',
    country: 'Vietnam',
    ssl: true
  }
};
```

## Future Enhancements

1. **Historical Tracking**: Store ScamAdviser results for trend analysis
2. **Community Integration**: Allow users to report scam websites
3. **Additional APIs**: Integrate more security analysis services
4. **Machine Learning**: Train models on combined security data
5. **Real-time Alerts**: Notify users of newly detected threats

## Deployment

1. **Environment Setup**: Add SCAMADVISER_API_KEY to production environment
2. **Health Checks**: The `/api/health` endpoint now includes ScamAdviser status
3. **Monitoring**: Logs include ScamAdviser API usage and response times
4. **Scaling**: Service designed to handle high-volume requests with rate limiting

## Support

For issues related to ScamAdviser integration:

1. Check API key configuration in environment variables
2. Verify ScamAdviser service status via `/api/scamadviser/status`
3. Review server logs for API response details
4. Test with mock data if API key is unavailable

The integration maintains backward compatibility - existing VirusTotal functionality continues to work independently if ScamAdviser is unavailable.
