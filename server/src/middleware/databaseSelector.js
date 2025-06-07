/**
 * Database Selector Middleware
 * Chooses the appropriate controller based on USE_FIRESTORE environment variable
 */

const communityController = require('../controllers/communityController');
const firestoreCommunityController = require('../controllers/firestoreCommunityController');

// Select the appropriate controller based on environment
function selectCommunityController() {
    const useFirestore = process.env.USE_FIRESTORE === 'true';
    
    if (useFirestore) {
        console.log('🔥 Using Firestore Community Controller');
        return firestoreCommunityController;
    } else {
        console.log('💾 Using In-Memory Community Controller');
        return communityController;
    }
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
