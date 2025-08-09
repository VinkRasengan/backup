import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from 'fs';
import path from 'path';
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

async function createWebAppDocx() {
    try {
        console.log('🔄 Creating Web Application User Guide DOCX...');
        
        // Read the markdown file
        const markdownPath = path.join(__dirname, '..', 'docs', 'USAGE-GUIDE.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Create a web-focused document
        const doc = new Document({
            sections: [{
                properties: {},
                children: createWebAppContent(markdownContent)
            }]
        });
        
        // Generate DOCX file
        const buffer = await Packer.toBuffer(doc);
        
        // Write to file
        const outputPath = path.join(__dirname, '..', 'docs', 'User_Guide.docx');
        fs.writeFileSync(outputPath, buffer);
        
        console.log('✅ Successfully created User_Guide.docx for Web Application');
        console.log(`📁 Output file: ${outputPath}`);
        console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating DOCX:', error);
        return false;
    }
}

function createWebAppContent(markdown) {
    const children = [];
    
    // Add title
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'FactCheck Anti-Fraud Platform',
                size: 36,
                bold: true
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Hướng Dẫn Sử Dụng Web Application',
                size: 28,
                bold: true
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 300 }
    }));
    
    // Add subtitle
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Tài liệu hướng dẫn người dùng cuối (User) cách truy cập và sử dụng hệ thống web',
                size: 18
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 }
    }));
    
    // Add video section (Page 2)
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Video Hướng Dẫn',
                size: 24,
                bold: true
            })
        ],
        spacing: { before: 300, after: 150 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Xem video hướng dẫn chi tiết cách sử dụng hệ thống web:',
                size: 16
            })
        ],
        spacing: { before: 100, after: 50 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Link trực tiếp: https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
                size: 16,
                color: '0066CC'
            })
        ],
        spacing: { before: 50, after: 200 }
    }));
    
    // Add Quick Start section
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Hướng Dẫn Truy Cập Nhanh',
                size: 24,
                bold: true
            })
        ],
        spacing: { before: 300, after: 150 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Để sử dụng hệ thống, bạn chỉ cần:',
                size: 16,
                bold: true
            })
        ],
        spacing: { before: 100, after: 50 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '1. Mở trình duyệt web (Chrome, Firefox, Edge, Safari)',
                size: 16
            })
        ],
        spacing: { before: 50, after: 30 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '2. Truy cập địa chỉ: http://localhost:3000',
                size: 16,
                color: '0066CC'
            })
        ],
        spacing: { before: 30, after: 30 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '3. Đăng ký tài khoản hoặc đăng nhập nếu đã có',
                size: 16
            })
        ],
        spacing: { before: 30, after: 30 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '4. Bắt đầu sử dụng các tính năng của hệ thống',
                size: 16
            })
        ],
        spacing: { before: 30, after: 200 }
    }));
    
    // Add system requirements
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Yêu Cầu Hệ Thống',
                size: 24,
                bold: true
            })
        ],
        spacing: { before: 300, after: 150 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '• Trình duyệt web hiện đại (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)',
                size: 16
            })
        ],
        spacing: { before: 50, after: 30 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '• Kết nối internet ổn định',
                size: 16
            })
        ],
        spacing: { before: 30, after: 30 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '• RAM tối thiểu: 4GB',
                size: 16
            })
        ],
        spacing: { before: 30, after: 30 }
    }));
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: '• Hệ điều hành: Windows 10+, macOS 10.15+, Linux',
                size: 16
            })
        ],
        spacing: { before: 30, after: 200 }
    }));
    
    // Parse main content (simplified and web-focused)
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            children.push(new Paragraph({}));
            continue;
        }
        
        // Skip certain sections that are not relevant for web users
        if (line.startsWith('# 🚀 FactCheck Anti-Fraud Platform') || 
            line.startsWith('## 📋 Mục Lục') ||
            line.includes('[Giới Thiệu]') ||
            line.includes('[Video Hướng Dẫn]') ||
            line.startsWith('---') ||
            line.includes('Docker') ||
            line.includes('Node.js') ||
            line.includes('npm install')) {
            continue;
        }
        
        // Headers
        if (line.startsWith('# ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(2),
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { before: 300, after: 150 }
            }));
        } else if (line.startsWith('## ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(3),
                        size: 20,
                        bold: true
                    })
                ],
                spacing: { before: 200, after: 100 }
            }));
        } else if (line.startsWith('### ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(4),
                        size: 18,
                        bold: true
                    })
                ],
                spacing: { before: 150, after: 75 }
            }));
        }
        // Lists
        else if (line.startsWith('- ') || line.startsWith('* ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(2),
                        size: 16
                    })
                ],
                spacing: { before: 50, after: 50 }
            }));
        } else if (line.match(/^\d+\.\s/)) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace(/^\d+\.\s/, ''),
                        size: 16
                    })
                ],
                spacing: { before: 50, after: 50 }
            }));
        }
        // Regular text
        else if (line) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        size: 16
                    })
                ],
                spacing: { before: 100, after: 100 }
            }));
        }
    }
    
    return children;
}

// Run the creation
createWebAppDocx(); 