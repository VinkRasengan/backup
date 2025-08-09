import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { execSync  } from 'child_process';
const chalk = require('chalk');
import fs from 'fs';
import path from 'path';

console.log(chalk.blue('🚀 Khởi động SonarQube...'));

try {
  // Kiểm tra Docker có sẵn không
  execSync('docker --version', { stdio: 'pipe' });
  console.log(chalk.green('✅ Docker đã được cài đặt'));

  // Khởi động SonarQube
  console.log(chalk.yellow('📦 Đang khởi động SonarQube containers...'));
  execSync('docker-compose -f docker-compose.sonarqube.yml up -d', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log(chalk.green('✅ SonarQube đã được khởi động thành công!'));
  console.log(chalk.cyan('🌐 Truy cập SonarQube tại: http://localhost:9000'));
  console.log(chalk.cyan('🔑 Mặc định credentials: admin/admin'));
  console.log(chalk.yellow('⏳ Vui lòng đợi 2-3 phút để SonarQube khởi động hoàn toàn'));

} catch (error) {
  console.error(chalk.red('❌ Lỗi khi khởi động SonarQube:'), error.message);
  process.exit(1);
}
