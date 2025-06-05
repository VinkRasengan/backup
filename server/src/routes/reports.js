const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   POST /api/reports/:linkId
// @desc    Submit a report for a link
// @access  Private
router.post('/:linkId', 
  validateRequest(schemas.submitReport),
  reportController.submitReport
);

// @route   GET /api/reports/user/my-reports
// @desc    Get user's reports with pagination
// @access  Private
router.get('/user/my-reports', reportController.getUserReports);

module.exports = router;
