/**
 * URL Utilities for handling various URL formats
 */

/**
 * Normalize URL by adding appropriate protocol
 * Handles:
 * - Protocol-relative URLs (//example.com) 
 * - URLs without protocol (example.com)
 * - Already valid URLs (https://example.com)
 * 
 * @param {string} url - The URL to normalize
 * @returns {string} - Normalized URL with protocol
 */
export const normalizeUrl = (url) => {
  if (!url) return url;

  // Remove whitespace
  url = url.trim();

  // Handle protocol-relative URLs (//example.com -> https://example.com)
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }
  // If no protocol, add https://
  else if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  return url;
};

/**
 * Validate if URL is properly formatted
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    new URL(normalizedUrl);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Domain name
 */
export const extractDomain = (url) => {
  if (!url) return '';
  
  try {
    const normalizedUrl = normalizeUrl(url);
    const domain = new URL(normalizedUrl).hostname;
    return domain.replace('www.', '');
  } catch {
    return '';
  }
};

/**
 * Check if URL is a protocol-relative URL
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL is protocol-relative
 */
export const isProtocolRelativeUrl = (url) => {
  return url && url.trim().startsWith('//');
};

const urlUtils = {
  normalizeUrl,
  isValidUrl,
  extractDomain,
  isProtocolRelativeUrl
};

export default urlUtils; 