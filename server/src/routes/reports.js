const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Try to load validation middleware, fallback if not available
let validateRequest, schemas;
try {
    const validation = require('../middleware/validation');
    validateRequest = validation.validateRequest;
    schemas = validation.schemas;
} catch (error) {
    console.warn('⚠️ Validation middleware not available for reports routes');
    validateRequest = (schema) => (req, res, next) => next();
    schemas = {};
}

// @route   POST /api/reports
// @desc    Submit a report for a link
// @access  Private
router.post('/',
  validateRequest(schemas.submitReport),
  reportController.createReport
);

// @route   GET /api/reports/link/:linkId
// @desc    Get reports for a specific link
// @access  Public
router.get('/link/:linkId', reportController.getReportsForLink);

// @route   GET /api/reports/all
// @desc    Get all reports (admin only)
// @access  Private (Admin)
router.get('/all', reportController.getAllReports);

// @route   PUT /api/reports/:reportId/status
// @desc    Update report status (admin only)
// @access  Private (Admin)
router.put('/:reportId/status', reportController.updateReportStatus);

// @route   GET /api/reports/stats
// @desc    Get report statistics
// @access  Private (Admin)
router.get('/stats', reportController.getReportStats);

// @route   DELETE /api/reports/:reportId
// @desc    Delete a report (admin only)
// @access  Private (Admin)
router.delete('/:reportId', reportController.deleteReport);

module.exports = router;
