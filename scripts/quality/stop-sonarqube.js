const { execSync } = require('child_process');
const chalk = require('chalk');
const path = require('path');

console.log(chalk.blue('🛑 Dừng SonarQube...'));

try {
  execSync('docker-compose -f docker-compose.sonarqube.yml down', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log(chalk.green('✅ SonarQube đã được dừng thành công!'));
  console.log(chalk.yellow('💾 Dữ liệu vẫn được lưu trong Docker volumes'));

} catch (error) {
  console.error(chalk.red('❌ Lỗi khi dừng SonarQube:'), error.message);
  process.exit(1);
}
