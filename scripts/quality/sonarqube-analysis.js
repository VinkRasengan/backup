import { execSync  } from 'child_process';
const chalk = require('chalk');
import fs from 'fs';
import path from 'path';

const SONAR_TOKEN = process.env.SONAR_TOKEN || 'your-sonar-token';
const SONAR_HOST = process.env.SONAR_HOST || 'http://localhost:9000';
const PROJECT_KEY = 'backup-project';

console.log(chalk.blue('🔍 Bắt đầu phân tích SonarQube...'));

// Tạo sonar-project.properties
const sonarConfig = `
sonar.projectKey=${PROJECT_KEY}
sonar.projectName=Backup Project
sonar.projectVersion=1.0
sonar.sources=client/src,services
sonar.exclusions=**/node_modules/**,**/coverage/**,**/dist/**,**/build/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/tests/**
sonar.host.url=${SONAR_HOST}
sonar.login=${SONAR_TOKEN}
`;

fs.writeFileSync('sonar-project.properties', sonarConfig);
console.log(chalk.green('✅ Đã tạo sonar-project.properties'));

try {
  // Cài đặt SonarScanner nếu chưa có
  console.log(chalk.yellow('📦 Kiểm tra SonarScanner...'));
  try {
    execSync('sonar-scanner --version', { stdio: 'pipe' });
    console.log(chalk.green('✅ SonarScanner đã được cài đặt'));
  } catch (error) {
    console.log(chalk.yellow('📥 Đang cài đặt SonarScanner...'));
    execSync('npm install -g sonarqube-scanner', { stdio: 'inherit' });
  }

  // Chạy phân tích
  console.log(chalk.blue('🔍 Đang chạy phân tích SonarQube...'));
  execSync('sonar-scanner', { stdio: 'inherit' });

  console.log(chalk.green('✅ Phân tích hoàn thành!'));
  console.log(chalk.cyan(`🌐 Xem kết quả tại: ${SONAR_HOST}/dashboard?id=${PROJECT_KEY}`));

} catch (error) {
  console.error(chalk.red('❌ Lỗi khi chạy phân tích:'), error.message);
  process.exit(1);
} finally {
  // Dọn dẹp
  if (fs.existsSync('sonar-project.properties')) {
    fs.unlinkSync('sonar-project.properties');
  }
}
