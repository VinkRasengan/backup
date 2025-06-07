/**
 * Database Selector Middleware
 * Chooses the appropriate controller based on USE_FIRESTORE environment variable
 */

const communityController = require('../controllers/communityController');
const firestoreCommunityController = require('../controllers/firestoreCommunityController');

// Always use Firestore controller (Firebase-only mode)
function selectCommunityController() {
    console.log('🔥 Using Firestore Community Controller (Firebase-only mode)');
    return firestoreCommunityController;
}

// Middleware to inject the correct controller
function injectCommunityController(req, res, next) {
    req.communityController = selectCommunityController();
    next();
}

module.exports = {
    selectCommunityController,
    injectCommunityController
};
