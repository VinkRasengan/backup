#!/usr/bin/env node
/**
 * Convert Scripts to ES Modules
 * Utility để chuyển đổi hàng loạt các script từ CommonJS sang ES modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ESModuleConverter {
  constructor() {
    this.scriptsDir = path.dirname(__filename);
    this.convertedCount = 0;
    this.skippedCount = 0;
  }

  /**
   * Chuyển đổi tất cả script từ CommonJS sang ES modules
   */
  async convertAllScripts() {
    console.log('🔄 Converting scripts from CommonJS to ES modules...');
    console.log('=' .repeat(60));

    try {
      await this.processDirectory(this.scriptsDir);
      
      console.log('\n✅ Conversion completed!');
      console.log(`📊 Converted: ${this.convertedCount} files`);
      console.log(`⏭️  Skipped: ${this.skippedCount} files`);
      
    } catch (error) {
      console.error('❌ Conversion failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Xử lý thư mục và tất cả file js
   */
  async processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        await this.convertFile(fullPath);
      }
    }
  }

  /**
   * Chuyển đổi một file từ CommonJS sang ES modules
   */
  async convertFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Kiểm tra nếu file đã là ES module
      if (content.includes('import ') && content.includes('from ')) {
        console.log(`⏭️  Skipped (already ES module): ${path.relative(this.scriptsDir, filePath)}`);
        this.skippedCount++;
        return;
      }

      // Kiểm tra nếu file có require statements
      if (!content.includes('require(')) {
        console.log(`⏭️  Skipped (no require): ${path.relative(this.scriptsDir, filePath)}`);
        this.skippedCount++;
        return;
      }

      let newContent = content;

      // Thay thế các require statements phổ biến
      const replacements = [
        // Child process
        { 
          from: /const\s*{\s*([^}]+)\s*}\s*=\s*require\(['"`]child_process['"`]\);?/g, 
          to: 'import { $1 } from \'child_process\';' 
        },
        { 
          from: /const\s+(\w+)\s*=\s*require\(['"`]child_process['"`]\);?/g, 
          to: 'import $1 from \'child_process\';' 
        },
        
        // File system
        { 
          from: /const\s+fs\s*=\s*require\(['"`]fs['"`]\);?/g, 
          to: 'import fs from \'fs\';' 
        },
        
        // Path
        { 
          from: /const\s+path\s*=\s*require\(['"`]path['"`]\);?/g, 
          to: 'import path from \'path\';' 
        },
        
        // OS
        { 
          from: /const\s+os\s*=\s*require\(['"`]os['"`]\);?/g, 
          to: 'import os from \'os\';' 
        },

        // Util
        { 
          from: /const\s*{\s*([^}]+)\s*}\s*=\s*require\(['"`]util['"`]\);?/g, 
          to: 'import { $1 } from \'util\';' 
        },

        // URL
        { 
          from: /const\s*{\s*([^}]+)\s*}\s*=\s*require\(['"`]url['"`]\);?/g, 
          to: 'import { $1 } from \'url\';' 
        }
      ];

      // Áp dụng các replacements
      for (const replacement of replacements) {
        newContent = newContent.replace(replacement.from, replacement.to);
      }

      // Thêm fileURLToPath import nếu cần
      if (newContent.includes('__filename') || newContent.includes('__dirname')) {
        if (!newContent.includes('fileURLToPath')) {
          newContent = newContent.replace(
            /(import\s+.*?from\s+['"`]url['"`];?)/,
            '$1\nimport { fileURLToPath } from \'url\';'
          );
          
          if (!newContent.includes('import') || !newContent.includes('url')) {
            newContent = 'import { fileURLToPath } from \'url\';\n' + newContent;
          }
        }

        // Thêm __filename và __dirname definitions
        if (!newContent.includes('const __filename')) {
          const importSection = newContent.match(/(import[\s\S]*?;(\n|$))+/);
          if (importSection) {
            const afterImports = newContent.substring(importSection[0].length);
            newContent = importSection[0] + '\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);\n' + afterImports;
          }
        }
      }

      // Thay thế require.main === module
      newContent = newContent.replace(
        /if\s*\(\s*require\.main\s*===\s*module\s*\)/g,
        'if (import.meta.url === `file://${process.argv[1]}`)'
      );

      // Better approach for main module check
      if (newContent.includes('import.meta.url === `file://${process.argv[1]}`')) {
        newContent = newContent.replace(
          /if\s*\(\s*import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`\s*\)/g,
          'if (process.argv[1] === fileURLToPath(import.meta.url))'
        );
      }

      // Thay thế module.exports
      newContent = newContent.replace(
        /module\.exports\s*=\s*([^;]+);?/g,
        'export default $1;'
      );

      // Nếu có thay đổi, ghi file
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Converted: ${path.relative(this.scriptsDir, filePath)}`);
        this.convertedCount++;
      } else {
        console.log(`⏭️  No changes needed: ${path.relative(this.scriptsDir, filePath)}`);
        this.skippedCount++;
      }

    } catch (error) {
      console.error(`❌ Error converting ${filePath}: ${error.message}`);
    }
  }
}

// Chạy converter
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === scriptPath) {
  const converter = new ESModuleConverter();
  converter.convertAllScripts();
}

export default ESModuleConverter;
