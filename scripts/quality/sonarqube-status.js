import { execSync  } from 'child_process';
const chalk = require('chalk');
const https = require('https');
const http = require('http');

const SONAR_HOST = process.env.SONAR_HOST || 'http://localhost:9000';

console.log(chalk.blue('🔍 Kiểm tra trạng thái SonarQube...'));

// Kiểm tra Docker containers
try {
  console.log(chalk.yellow('📦 Kiểm tra Docker containers...'));
  const containers = execSync('docker ps --filter name=sonarqube --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { encoding: 'utf8' });
  console.log(containers);

  // Kiểm tra kết nối đến SonarQube
  console.log(chalk.yellow('🌐 Kiểm tra kết nối đến SonarQube...'));
  
  const url = new URL(SONAR_HOST);
  const client = url.protocol === 'https:' ? https : http;
  
  const req = client.get(SONAR_HOST, (res) => {
    if (res.statusCode === 200) {
      console.log(chalk.green('✅ SonarQube đang hoạt động bình thường'));
      console.log(chalk.cyan(`🌐 URL: ${SONAR_HOST}`));
      console.log(chalk.cyan('🔑 Login: admin/admin'));
    } else {
      console.log(chalk.yellow(`⚠️ SonarQube trả về status: ${res.statusCode}`));
    }
  });

  req.on('error', (error) => {
    console.log(chalk.red('❌ Không thể kết nối đến SonarQube'));
    console.log(chalk.yellow('💡 Hãy chạy: npm run sonar:start'));
  });

  req.setTimeout(5000, () => {
    console.log(chalk.red('❌ Timeout khi kết nối đến SonarQube'));
  });

} catch (error) {
  console.error(chalk.red('❌ Lỗi khi kiểm tra trạng thái:'), error.message);
}
