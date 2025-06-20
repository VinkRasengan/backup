#!/usr/bin/env node

/**
 * Quick API Gateway Health Check
 */

const axios = require('axios');

async function quickHealthCheck() {
  const baseURL = 'http://localhost:8080';
  
  console.log('🔍 Quick API Gateway Health Check...\n');
  
  const endpoints = [
    { method: 'GET', path: '/health', name: 'Health Check' },
    { method: 'GET', path: '/info', name: 'Service Info' },
    { method: 'GET', path: '/metrics', name: 'Metrics' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 5000
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status} - ${response.statusText}`);
    } catch (error) {
      const status = error.response?.status || 'CONNECTION_ERROR';
      console.log(`❌ ${endpoint.name}: ${status} - ${error.message}`);
    }
  }
}

quickHealthCheck();
