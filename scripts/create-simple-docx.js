const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

async function createSimpleDocx() {
    try {
        console.log('🔄 Creating simple DOCX file...');
        
        // Read the markdown file
        const markdownPath = path.join(__dirname, '..', 'docs', 'USAGE-GUIDE.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Create a simple document
        const doc = new Document({
            sections: [{
                properties: {},
                children: createSimpleContent(markdownContent)
            }]
        });
        
        // Generate DOCX file
        const buffer = await Packer.toBuffer(doc);
        
        // Write to file
        const outputPath = path.join(__dirname, '..', 'docs', 'User_Guide.docx');
        fs.writeFileSync(outputPath, buffer);
        
        console.log('✅ Successfully created User_Guide.docx');
        console.log(`📁 Output file: ${outputPath}`);
        console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating DOCX:', error);
        return false;
    }
}

function createSimpleContent(markdown) {
    const children = [];
    
    // Add title
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'FactCheck Anti-Fraud Platform - Hướng Dẫn Sử Dụng',
                size: 32,
                bold: true
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 }
    }));
    
    // Add subtitle
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Tài liệu hướng dẫn người dùng cuối (User) cách cài đặt và sử dụng sản phẩm',
                size: 20
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 }
    }));
    
    // Add video section
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
                text: 'Xem video hướng dẫn chi tiết cách sử dụng hệ thống:',
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
    
    // Parse main content (simplified)
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            children.push(new Paragraph({}));
            continue;
        }
        
        // Skip certain sections
        if (line.startsWith('# 🚀 FactCheck Anti-Fraud Platform') || 
            line.startsWith('## 📋 Mục Lục') ||
            line.includes('[Giới Thiệu]') ||
            line.includes('[Video Hướng Dẫn]') ||
            line.startsWith('---')) {
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
        // Code blocks
        else if (line.startsWith('```')) {
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            
            if (codeLines.length > 0) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: codeLines.join('\n'),
                            font: 'Courier New',
                            size: 14
                        })
                    ],
                    spacing: { before: 100, after: 100 }
                }));
            }
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
createSimpleDocx(); 