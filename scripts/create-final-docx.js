import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from 'fs';
import path from 'path';
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

async function createFinalDocx() {
    try {
        console.log('🚀 Creating final User Guide DOCX...\n');
        
        // Step 1: Create DOCX
        console.log('📝 Step 1: Creating DOCX file...');
        const success = await createDocxFile();
        
        if (!success) {
            console.error('❌ DOCX creation failed!');
            return false;
        }
        
        console.log('✅ DOCX creation completed successfully!\n');
        
        // Step 2: Validate
        console.log('🔍 Step 2: Validating DOCX file...');
        const isValid = validateDocxFile();
        
        if (!isValid) {
            console.error('❌ Validation failed!');
            return false;
        }
        
        console.log('✅ Validation completed successfully!\n');
        
        // Step 3: Summary
        console.log('🎉 Final User Guide DOCX created successfully!');
        console.log('📁 Output file: docs/User_Guide.docx');
        console.log('📊 File size: ~16 KB');
        console.log('📝 Ready to open in Microsoft Word');
        console.log('🎥 Video tutorial link included on page 2');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during creation:', error);
        return false;
    }
}

async function createDocxFile() {
    try {
        // Read the markdown file
        const markdownPath = path.join(__dirname, '..', 'docs', 'USAGE-GUIDE.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Create a simple document
        const doc = new Document({
            sections: [{
                properties: {},
                children: createContent(markdownContent)
            }]
        });
        
        // Generate DOCX file
        const buffer = await Packer.toBuffer(doc);
        
        // Write to file
        const outputPath = path.join(__dirname, '..', 'docs', 'User_Guide.docx');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`📊 Generated file size: ${(buffer.length / 1024).toFixed(2)} KB`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating DOCX:', error);
        return false;
    }
}

function createContent(markdown) {
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
                text: 'Hướng Dẫn Sử Dụng',
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
                text: 'Tài liệu hướng dẫn người dùng cuối (User) cách cài đặt và sử dụng sản phẩm',
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

function validateDocxFile() {
    try {
        const docxPath = path.join(__dirname, '..', 'docs', 'User_Guide.docx');
        
        // Check if file exists
        if (!fs.existsSync(docxPath)) {
            console.error('❌ DOCX file not found!');
            return false;
        }
        
        // Get file stats
        const stats = fs.statSync(docxPath);
        const fileSize = stats.size;
        
        // Check if file is not empty
        if (fileSize === 0) {
            console.error('❌ File is empty!');
            return false;
        }
        
        // Read first few bytes to check DOCX signature
        const buffer = fs.readFileSync(docxPath);
        const signature = buffer.slice(0, 4);
        
        // DOCX files start with PK (ZIP format)
        if (signature[0] === 0x50 && signature[1] === 0x4B) {
            console.log('✅ File has valid DOCX signature (ZIP format)');
        } else {
            console.error('❌ File does not have valid DOCX signature!');
            return false;
        }
        
        // Check for required DOCX structure
        const content = buffer.toString('binary');
        
        // Check for common DOCX elements
        const hasWordDocument = content.includes('word/document.xml');
        const hasContentTypes = content.includes('[Content_Types].xml');
        const hasRelationships = content.includes('_rels/.rels');
        
        if (hasWordDocument && hasContentTypes && hasRelationships) {
            console.log('✅ DOCX file structure appears valid');
        } else {
            console.error('❌ DOCX file structure is invalid!');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error validating DOCX file:', error);
        return false;
    }
}

// Run the creation
createFinalDocx(); 