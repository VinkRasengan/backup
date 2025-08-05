const fs = require('fs');
const path = require('path');
const { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    AlignmentType, 
    ExternalHyperlink,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    PageBreak,
    SectionType
} = require('docx');

async function generateUserGuide() {
    try {
        console.log('🚀 Starting User Guide generation...\n');
        
        // Step 1: Convert markdown to DOCX
        console.log('📝 Step 1: Converting USAGE-GUIDE.md to DOCX...');
        const success = await convertUsageGuideToDocx();
        
        if (!success) {
            console.error('❌ Conversion failed!');
            return false;
        }
        
        console.log('✅ Conversion completed successfully!\n');
        
        // Step 2: Validate the generated DOCX
        console.log('🔍 Step 2: Validating generated DOCX file...');
        const isValid = validateDocxFile();
        
        if (!isValid) {
            console.error('❌ Validation failed!');
            return false;
        }
        
        console.log('✅ Validation completed successfully!\n');
        
        // Step 3: Summary
        console.log('🎉 User Guide generation completed successfully!');
        console.log('📁 Output file: docs/User_Guide.docx');
        console.log('📊 File size: ~17 KB');
        console.log('📝 Ready to open in Microsoft Word');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during generation:', error);
        return false;
    }
}

async function convertUsageGuideToDocx() {
    try {
        // Read the markdown file
        const markdownPath = path.join(__dirname, '..', 'docs', 'USAGE-GUIDE.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Create document with proper structure
        const doc = new Document({
            sections: [{
                properties: {
                    type: SectionType.CONTINUOUS,
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: createDocumentContent(markdownContent)
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
        console.error('❌ Error converting to DOCX:', error);
        return false;
    }
}

function createDocumentContent(markdown) {
    const children = [];
    
    // Add title page
    children.push(...createTitlePage());
    
    // Add page break
    children.push(new Paragraph({ pageBreakBefore: true }));
    
    // Add table of contents
    children.push(...createTableOfContents());
    
    // Add page break
    children.push(new Paragraph({ pageBreakBefore: true }));
    
    // Parse main content
    children.push(...parseMarkdownContent(markdown));
    
    return children;
}

function createTitlePage() {
    return [
        new Paragraph({
            children: [
                new TextRun({
                    text: 'FactCheck Anti-Fraud Platform',
                    size: 48,
                    bold: true,
                    color: '2E3440'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Hướng Dẫn Sử Dụng',
                    size: 36,
                    bold: true,
                    color: '5E81AC'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Tài liệu hướng dẫn người dùng cuối (User) cách cài đặt và sử dụng sản phẩm',
                    size: 24,
                    color: '4C566A'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Phiên bản: 2.0`,
                    size: 20,
                    color: '4C566A'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Ngày cập nhật: ${new Date().toLocaleDateString('vi-VN')}`,
                    size: 20,
                    color: '4C566A'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 400 }
        })
    ];
}

function createTableOfContents() {
    return [
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Mục Lục',
                    size: 32,
                    bold: true,
                    color: '2E3440'
                })
            ],
            spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '1. Giới Thiệu',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 100, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '2. Video Hướng Dẫn',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '3. Yêu Cầu Hệ Thống',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '4. Cài Đặt và Thiết Lập',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '5. Hướng Dẫn Sử Dụng',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '6. Tính Năng Chính',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '7. Cộng Đồng và Tương Tác',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '8. Bảo Mật và Quyền Riêng Tư',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '9. Xử Lý Sự Cố',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 50 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: '10. Liên Hệ Hỗ Trợ',
                    size: 20,
                    color: '5E81AC'
                })
            ],
            spacing: { before: 50, after: 200 }
        })
    ];
}

function parseMarkdownContent(markdown) {
    const lines = markdown.split('\n');
    const children = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            children.push(new Paragraph({}));
            continue;
        }
        
        // Skip the main title and table of contents from markdown since we added them manually
        if (line.startsWith('# 🚀 FactCheck Anti-Fraud Platform') || 
            line.startsWith('## 📋 Mục Lục') ||
            line.includes('[Giới Thiệu]') ||
            line.includes('[Video Hướng Dẫn]')) {
            continue;
        }
        
        // Headers
        if (line.startsWith('# ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(2),
                        size: 32,
                        bold: true,
                        color: '2E3440'
                    })
                ],
                spacing: { before: 400, after: 200 }
            }));
        } else if (line.startsWith('## ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(3),
                        size: 28,
                        bold: true,
                        color: '5E81AC'
                    })
                ],
                spacing: { before: 300, after: 150 }
            }));
        } else if (line.startsWith('### ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(4),
                        size: 24,
                        bold: true,
                        color: '4C566A'
                    })
                ],
                spacing: { before: 200, after: 100 }
            }));
        } else if (line.startsWith('#### ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(5),
                        size: 20,
                        bold: true,
                        color: '4C566A'
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
                            size: 18,
                            color: '2E3440'
                        })
                    ],
                    spacing: { before: 100, after: 100 },
                    shading: { fill: 'F8F9FA' }
                }));
            }
        }
        // Lists
        else if (line.startsWith('- ') || line.startsWith('* ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.substring(2),
                        size: 20,
                        color: '4C566A'
                    })
                ],
                bullet: { level: 0 },
                spacing: { before: 50, after: 50 }
            }));
        } else if (line.match(/^\d+\.\s/)) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace(/^\d+\.\s/, ''),
                        size: 20,
                        color: '4C566A'
                    })
                ],
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { before: 50, after: 50 }
            }));
        }
        // Bold text
        else if (line.includes('**') && line.split('**').length > 2) {
            const parts = line.split('**');
            const textRuns = [];
            
            for (let j = 0; j < parts.length; j++) {
                if (j % 2 === 1) { // Bold text
                    textRuns.push(new TextRun({
                        text: parts[j],
                        bold: true,
                        size: 20,
                        color: '2E3440'
                    }));
                } else if (parts[j]) { // Regular text
                    textRuns.push(new TextRun({
                        text: parts[j],
                        size: 20,
                        color: '4C566A'
                    }));
                }
            }
            
            children.push(new Paragraph({
                children: textRuns,
                spacing: { before: 100, after: 100 }
            }));
        }
        // Links
        else if (line.includes('[') && line.includes('](') && line.includes(')')) {
            const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                children.push(new Paragraph({
                    children: [
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: linkMatch[1],
                                    color: '0066CC',
                                    underline: {},
                                    size: 20
                                })
                            ],
                            link: linkMatch[2]
                        })
                    ],
                    spacing: { before: 100, after: 100 }
                }));
            }
        }
        // Regular text
        else if (line) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        size: 20,
                        color: '4C566A'
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

// Run the generation
generateUserGuide(); 