const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Store alerts in memory (in production, use a database)
const alerts = [];

// Webhook endpoint for all alerts
app.post('/webhook', (req, res) => {
  const alertData = req.body;
  
  console.log('🚨 Alert received:', JSON.stringify(alertData, null, 2));
  
  // Store alert
  alerts.push({
    ...alertData,
    receivedAt: new Date().toISOString()
  });
  
  // Keep only last 100 alerts
  if (alerts.length > 100) {
    alerts.shift();
  }
  
  res.status(200).json({ status: 'received' });
});

// Critical alerts endpoint
app.post('/webhook/critical', (req, res) => {
  const alertData = req.body;
  
  console.log('🔥 CRITICAL Alert received:', JSON.stringify(alertData, null, 2));
  
  // Here you could integrate with Slack, Discord, SMS, etc.
  // For now, just log and store
  alerts.push({
    ...alertData,
    severity: 'CRITICAL',
    receivedAt: new Date().toISOString()
  });
  
  // Send notification (example)
  sendNotification('CRITICAL', alertData);
  
  res.status(200).json({ status: 'critical alert received' });
});

// Warning alerts endpoint
app.post('/webhook/warning', (req, res) => {
  const alertData = req.body;
  
  console.log('⚠️ Warning Alert received:', JSON.stringify(alertData, null, 2));
  
  alerts.push({
    ...alertData,
    severity: 'WARNING',
    receivedAt: new Date().toISOString()
  });
  
  res.status(200).json({ status: 'warning alert received' });
});

// Get all alerts
app.get('/alerts', (req, res) => {
  res.json({
    total: alerts.length,
    alerts: alerts.slice(-20) // Return last 20 alerts
  });
});

// Get alerts by severity
app.get('/alerts/:severity', (req, res) => {
  const { severity } = req.params;
  const filteredAlerts = alerts.filter(alert => 
    alert.severity && alert.severity.toLowerCase() === severity.toLowerCase()
  );
  
  res.json({
    severity: severity.toUpperCase(),
    total: filteredAlerts.length,
    alerts: filteredAlerts.slice(-20)
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'webhook-service',
    uptime: process.uptime(),
    alertsReceived: alerts.length,
    timestamp: new Date().toISOString()
  });
});

// Simple notification function (extend this for real integrations)
function sendNotification(severity, alertData) {
  // Example: Send to Slack, Discord, email, SMS, etc.
  console.log(`📢 Sending ${severity} notification:`, {
    alerts: alertData.alerts?.map(alert => ({
      alertname: alert.labels?.alertname,
      summary: alert.annotations?.summary,
      description: alert.annotations?.description,
      instance: alert.labels?.instance,
      job: alert.labels?.job
    }))
  });
  
  // Here you would integrate with your notification services:
  // - Slack webhook
  // - Discord webhook
  // - Email service
  // - SMS service
  // - Push notifications
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook service started on port ${PORT}`);
  console.log(`📊 Alerts endpoint: http://localhost:${PORT}/alerts`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
});
