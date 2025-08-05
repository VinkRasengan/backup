#!/usr/bin/env node
/**
 * Port Conflict Fixer
 * Tự động phát hiện và sửa các conflict port
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class PortConflictFixer {
  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Kiểm tra và kill process trên port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        // Tìm PID trên Windows
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (error || !stdout.trim()) {
            resolve(false);
          } else {
            // Parse PID từ output
            const lines = stdout.trim().split('\n');
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 5) {
                const pid = parts[4];
                if (pid && pid !== '0') {
                  console.log(`🔫 Killing process ${pid} on port ${port}...`);
                  exec(`taskkill /PID ${pid} /F`, (killError) => {
                    if (killError) {
                      console.log(`⚠️  Không thể kill process ${pid}: ${killError.message}`);
                    } else {
                      console.log(`✅ Đã kill process ${pid} trên port ${port}`);
                    }
                  });
                }
              }
            }
            resolve(true);
          }
        });
      } else {
        // Tìm PID trên Linux/Mac
        exec(`lsof -ti :${port}`, (error, stdout) => {
          if (error || !stdout.trim()) {
            resolve(false);
          } else {
            const pids = stdout.trim().split('\n');
            pids.forEach(pid => {
              if (pid) {
                console.log(`🔫 Killing process ${pid} on port ${port}...`);
                exec(`kill -9 ${pid}`, (killError) => {
                  if (killError) {
                    console.log(`⚠️  Không thể kill process ${pid}: ${killError.message}`);
                  } else {
                    console.log(`✅ Đã kill process ${pid} trên port ${port}`);
                  }
                });
              }
            });
            resolve(true);
          }
        });
      }
    });
  }

  /**
   * Kiểm tra port đang được sử dụng
   */
  async checkPortUsage(port) {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const command = isWindows 
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error || !stdout.trim()) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Fix cấu hình port trong file app.js
   */
  fixServiceConfig(serviceName, expectedPort) {
    const serviceConfigs = {
      'News Service': {
        path: 'services/news-service/app.js',
        oldPattern: /const PORT = process\.env\.PORT \|\| \d+;/,
        newPattern: `const PORT = process.env.NEWS_SERVICE_PORT || ${expectedPort};`
      },
      'Admin Service': {
        path: 'services/admin-service/app.js',
        oldPattern: /const PORT = process\.env\.PORT \|\| \d+;/,
        newPattern: `const PORT = process.env.ADMIN_SERVICE_PORT || ${expectedPort};`
      },
      'Event Bus Service': {
        path: 'services/event-bus-service/src/app.js',
        oldPattern: /this\.port = process\.env\.EVENT_BUS_SERVICE_PORT \|\| process\.env\.PORT \|\| \d+;/,
        newPattern: `this.port = process.env.EVENT_BUS_SERVICE_PORT || ${expectedPort};`
      },
      'ETL Service': {
        path: 'services/etl-service/app.js',
        oldPattern: /const PORT = process\.env\.ETL_SERVICE_PORT \|\| \d+;/,
        newPattern: `const PORT = process.env.ETL_SERVICE_PORT || ${expectedPort};`
      }
    };

    const config = serviceConfigs[serviceName];
    if (!config) {
      return { error: `Không có cấu hình fix cho ${serviceName}` };
    }

    const filePath = path.join(this.rootDir, config.path);
    if (!fs.existsSync(filePath)) {
      return { error: `Không tìm thấy file ${config.path}` };
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('process.env.PORT')) {
        content = content.replace(config.oldPattern, config.newPattern);
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: `Đã fix cấu hình port cho ${serviceName}` };
      }

      return { info: `${serviceName} đã có cấu hình port đúng` };
    } catch (error) {
      return { error: `Lỗi fix cấu hình ${serviceName}: ${error.message}` };
    }
  }

  /**
   * Chạy fix tất cả
   */
  async run() {
    console.log('🔧 Fix Port Conflicts...\n');

    // Danh sách port cần kiểm tra
    const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3010, 3011, 3012, 8080];
    
    // Kiểm tra và kill process trên các port
    console.log('🔍 Kiểm tra process đang sử dụng port...');
    for (const port of ports) {
      const usage = await this.checkPortUsage(port);
      if (usage) {
        console.log(`🔴 Port ${port} đang được sử dụng`);
        await this.killProcessOnPort(port);
      } else {
        console.log(`🟢 Port ${port} sẵn sàng`);
      }
    }

    console.log('\n🔧 Fix cấu hình port trong các service...');
    
    // Fix cấu hình port
    const servicesToFix = [
      { name: 'News Service', port: 3005 },
      { name: 'Admin Service', port: 3006 },
      { name: 'Event Bus Service', port: 3007 },
      { name: 'ETL Service', port: 3011 }
    ];

    for (const service of servicesToFix) {
      const result = this.fixServiceConfig(service.name, service.port);
      if (result.success) {
        console.log(`✅ ${result.success}`);
      } else if (result.info) {
        console.log(`ℹ️  ${result.info}`);
      } else if (result.error) {
        console.log(`❌ ${result.error}`);
      }
    }

    console.log('\n✅ Hoàn thành fix port conflicts!');
    console.log('\n💡 Để kiểm tra lại, hãy chạy:');
    console.log('   npm run check:ports');
    console.log('   npm run check:port3000');
  }
}

// Chạy fix
if (require.main === module) {
  const fixer = new PortConflictFixer();
  fixer.run().catch(console.error);
}

module.exports = PortConflictFixer; 