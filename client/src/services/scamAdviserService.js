import axios from 'axios';

class ScamAdviserService {
  constructor() {
    // ✅ Use API Gateway instead of direct backend service
    this.apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
  }

  /**
   * Check URL with ScamAdviser via backend API
   */
  async checkUrl(url) {
    try {
      console.log('Checking URL with ScamAdviser:', url);
      
      // ✅ Use API Gateway with proper authentication
      const response = await axios.post(`${this.apiUrl}/api/security/scamadviser/check`, {
        url: url
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        timeout: 60000 // 60 second timeout for ScamAdviser API
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('ScamAdviser service error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        return {
          success: false,
          error: `ScamAdviser API error: ${status} - ${errorData?.message || 'Unknown error'}`,
          data: null
        };
      }

      return {
        success: false,
        error: 'Failed to connect to ScamAdviser service',
        data: null
      };
    }
  }

  /**
   * Get trust score for display
   */
  formatTrustScore(score) {
    if (score === null || score === undefined) {
      return 'N/A';
    }
    return `${score}/100`;
  }

  /**
   * Get risk level description in Vietnamese
   */
  getRiskLevelText(riskLevel) {
    const riskTexts = {
      'low': 'Thấp',
      'medium': 'Trung bình', 
      'high': 'Cao',
      'very_high': 'Rất cao',
      'unknown': 'Không xác định'
    };
    
    return riskTexts[riskLevel] || 'Không xác định';
  }

  /**
   * Get risk level color class
   */
  getRiskLevelColor(riskLevel) {
    const colorClasses = {
      'low': 'text-green-600 dark:text-green-400',
      'medium': 'text-yellow-600 dark:text-yellow-400',
      'high': 'text-orange-600 dark:text-orange-400', 
      'very_high': 'text-red-600 dark:text-red-400',
      'unknown': 'text-gray-600 dark:text-gray-400'
    };
    
    return colorClasses[riskLevel] || 'text-gray-600 dark:text-gray-400';
  }

  /**
   * Format risk factors for display
   */
  formatRiskFactors(riskFactors) {
    if (!riskFactors || !Array.isArray(riskFactors) || riskFactors.length === 0) {
      return [];
    }

    // Translate common risk factors to Vietnamese
    const translations = {
      'Suspicious activity detected': 'Phát hiện hoạt động đáng ngờ',
      'High phishing risk': 'Nguy cơ lừa đảo cao',
      'High malware risk': 'Nguy cơ malware cao',
      'Potential fake shop': 'Có thể là cửa hàng giả',
      'High-risk country': 'Quốc gia có rủi ro cao',
      'Very new domain': 'Tên miền rất mới',
      'No SSL/HTTPS security': 'Không có bảo mật SSL/HTTPS',
      'Domain is blacklisted': 'Tên miền nằm trong danh sách đen'
    };

    return riskFactors.map(factor => translations[factor] || factor);
  }

  /**
   * Check if ScamAdviser data is available
   */
  isDataAvailable(scamAdviserData) {
    return scamAdviserData && 
           scamAdviserData.success && 
           !scamAdviserData.error &&
           scamAdviserData.trustScore !== null;
  }

  /**
   * Generate summary text for ScamAdviser results
   */
  generateSummary(scamAdviserData) {
    if (!this.isDataAvailable(scamAdviserData)) {
      return 'Không có dữ liệu từ ScamAdviser';
    }

    const { trustScore, riskLevel, riskFactors } = scamAdviserData;
    const riskText = this.getRiskLevelText(riskLevel);
    
    let summary = `ScamAdviser đánh giá trang web này có điểm tin cậy ${trustScore}/100 với mức rủi ro ${riskText.toLowerCase()}.`;
    
    if (riskFactors && riskFactors.length > 0) {
      const translatedFactors = this.formatRiskFactors(riskFactors);
      summary += ` Các yếu tố rủi ro: ${translatedFactors.join(', ')}.`;
    }

    // Add recommendation based on risk level
    if (riskLevel === 'very_high') {
      summary += ' Khuyến nghị tránh truy cập trang web này.';
    } else if (riskLevel === 'high') {
      summary += ' Khuyến nghị thận trọng khi sử dụng trang web này.';
    } else if (riskLevel === 'medium') {
      summary += ' Hãy cẩn thận khi cung cấp thông tin cá nhân.';
    } else if (riskLevel === 'low') {
      summary += ' Trang web này được đánh giá là đáng tin cậy.';
    }

    return summary;
  }
}

export default new ScamAdviserService();
