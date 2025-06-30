/**
 * Admin utilities for FactCheck platform
 */

/**
 * Check if user is admin based on email domain
 * @param {string} email - User email
 * @returns {boolean} - True if admin
 */
export const isAdminEmail = (email) => {
  if (!email) return false;
  return email.endsWith('@factcheck.com');
};

/**
 * Check if user is admin
 * @param {object} user - User object with email property
 * @returns {boolean} - True if admin
 */
export const isAdminUser = (user) => {
  if (!user || !user.email) return false;
  return isAdminEmail(user.email);
};

/**
 * Check if email verification should be bypassed for user
 * Admin users (@factcheck.com) don't need email verification
 * @param {object} user - User object
 * @returns {boolean} - True if verification should be bypassed
 */
export const shouldBypassEmailVerification = (user) => {
  return isAdminUser(user);
};

/**
 * Check if user has email verified or is admin (bypass verification)
 * @param {object} user - User object
 * @returns {boolean} - True if email is verified or user is admin
 */
export const isEmailVerifiedOrAdmin = (user) => {
  if (!user) return false;
  
  // Admin users don't need email verification
  if (isAdminUser(user)) {
    return true;
  }
  
  // Regular users need email verification
  return user.emailVerified === true;
};

/**
 * Get user display info including admin status
 * @param {object} user - User object
 * @returns {object} - Enhanced user info
 */
export const getUserDisplayInfo = (user) => {
  if (!user) return null;
  
  return {
    ...user,
    isAdmin: isAdminUser(user),
    needsEmailVerification: !isEmailVerifiedOrAdmin(user),
    displayRole: isAdminUser(user) ? 'Admin' : 'User'
  };
}; 