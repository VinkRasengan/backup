# News APIs Integration Guide

This document describes the integration of NewsAPI and NewsData.io APIs into the FactCheck application.

## Overview

The FactCheck application now supports two news APIs:
- **NewsAPI** (newsapi.org) - Popular news aggregation service
- **NewsData.io** - Real-time news data API

Both APIs are integrated to provide comprehensive news coverage for fact-checking purposes.

## Configuration

### Environment Variables

Add the following to your `server/.env` file:

```env
# News APIs Configuration
NEWSAPI_API_KEY=your_newsapi_key_here
NEWSAPI_BASE_URL=https://newsapi.org/v2

NEWSDATA_API_KEY=your_newsdata_key_here
NEWSDATA_BASE_URL=https://newsdata.io/api/1
```

### API Keys

1. **NewsAPI**: Get your free API key from [newsapi.org](https://newsapi.org/register)
2. **NewsData.io**: Get your free API key from [newsdata.io](https://newsdata.io/register)

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Get Latest News
```
GET /api/news/latest
```

**Parameters:**
- `source` (optional): `newsapi`, `newsdata`, or `both` (default: `both`)
- `country` (optional): Country code (e.g., `us`, `vn`)
- `category` (optional): News category
- `language` (optional): Language code
- `pageSize` (optional): Number of results for NewsAPI
- `size` (optional): Number of results for NewsData.io

**Example:**
```bash
curl "http://localhost:10000/api/news/latest?source=both&country=us"
```

#### 2. Search News
```
GET /api/news/search
```

**Parameters:**
- `q` (required): Search query
- `source` (optional): API source
- `language` (optional): Language code
- `sortBy` (optional): Sort order for NewsAPI
- `pageSize` (optional): Number of results for NewsAPI
- `size` (optional): Number of results for NewsData.io

**Example:**
```bash
curl "http://localhost:10000/api/news/search?q=technology&source=both"
```

#### 3. Get Vietnam News
```
GET /api/news/vietnam
```

**Parameters:**
- `source` (optional): API source

**Example:**
```bash
curl "http://localhost:10000/api/news/vietnam"
```

#### 4. Get Fact-Checking News
```
GET /api/news/fact-check
```

**Parameters:**
- `source` (optional): API source

**Example:**
```bash
curl "http://localhost:10000/api/news/fact-check"
```

#### 5. Get News by Category
```
GET /api/news/category/:category
```

**Parameters:**
- `category` (required): News category (business, technology, health, etc.)
- `source` (optional): API source

**Example:**
```bash
curl "http://localhost:10000/api/news/category/technology"
```

#### 6. Get News Sources
```
GET /api/news/sources
```

**Parameters:**
- `source` (optional): API source
- `country` (optional): Country filter
- `category` (optional): Category filter
- `language` (optional): Language filter

**Example:**
```bash
curl "http://localhost:10000/api/news/sources"
```

#### 7. Search News Archive (NewsData.io only)
```
GET /api/news/archive
```

**Parameters:**
- `q` (required): Search query
- `from_date` (required): Start date (YYYY-MM-DD)
- `to_date` (required): End date (YYYY-MM-DD)
- `language` (optional): Language code
- `country` (optional): Country code
- `size` (optional): Number of results

**Example:**
```bash
curl "http://localhost:10000/api/news/archive?q=covid&from_date=2024-01-01&to_date=2024-01-31"
```

### Protected Endpoints (Authentication Required)

#### 1. Premium Latest News
```
GET /api/news/premium/latest
```
- Requires authentication
- Returns more results (up to 50)
- Advanced filtering options

#### 2. Premium Search
```
GET /api/news/premium/search
```
- Requires authentication
- Enhanced search capabilities
- More results per request

## Response Format

All endpoints return a consistent JSON response:

```json
{
  "success": true,
  "data": {
    "newsapi": {
      "success": true,
      "totalResults": 100,
      "articles": [...]
    },
    "newsdata": {
      "success": true,
      "totalResults": 50,
      "articles": [...],
      "nextPage": "token"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Service Classes

### NewsApiService

Located at `server/src/services/newsApiService.js`

**Methods:**
- `getTopHeadlines(options)` - Get top headlines
- `searchNews(options)` - Search news articles
- `getSources(options)` - Get available sources
- `getVietnamNews(options)` - Get Vietnam-specific news
- `getFactCheckNews(options)` - Get fact-checking news

### NewsDataService

Located at `server/src/services/newsDataService.js`

**Methods:**
- `getLatestNews(options)` - Get latest news
- `searchArchive(options)` - Search news archive
- `getSources(options)` - Get available sources
- `getVietnamNews(options)` - Get Vietnam-specific news
- `getFactCheckNews(options)` - Get fact-checking news
- `getTechnologyNews(options)` - Get technology news
- `getBusinessNews(options)` - Get business news

## Testing

### Unit Tests

Run the unit tests:
```bash
cd server
npm test -- --testPathPattern=newsApiService
npm test -- --testPathPattern=newsDataService
```

### Integration Test

Run the integration test script:
```bash
node scripts/test-news-apis.js
```

This script will:
- Check API key configuration
- Test all major endpoints
- Display sample results
- Show available endpoints and usage examples

## Error Handling

All services include comprehensive error handling:

```javascript
{
  "success": false,
  "error": "API key invalid",
  "data": null
}
```

Common error scenarios:
- Missing or invalid API keys
- Rate limit exceeded
- Network timeouts
- Invalid parameters

## Rate Limits

### NewsAPI
- Free plan: 1,000 requests per day
- Developer plan: 500 requests per day for development

### NewsData.io
- Free plan: 200 requests per day
- Paid plans available for higher limits

## Best Practices

1. **Caching**: Implement caching for frequently requested data
2. **Rate Limiting**: Monitor API usage to avoid exceeding limits
3. **Error Handling**: Always check the `success` field in responses
4. **Fallbacks**: Use both APIs for redundancy
5. **Filtering**: Use specific parameters to get relevant results

## Integration with FactCheck Features

The News APIs can be integrated with existing FactCheck features:

1. **Link Verification**: Cross-reference suspicious links with news sources
2. **Fact-Checking**: Use fact-checking news to verify claims
3. **Context**: Provide news context for fact-checking requests
4. **Trending**: Show trending news topics for fact-checking
5. **Sources**: Verify news source credibility

## Future Enhancements

Potential improvements:
- News sentiment analysis
- Automatic fact-checking suggestions
- News source credibility scoring
- Real-time news alerts
- Custom news categories for fact-checking
