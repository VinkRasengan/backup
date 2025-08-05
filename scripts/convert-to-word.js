const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

async function convertMarkdownToWord() {
    try {
        console.log('🚀 Bắt đầu chuyển đổi...');
        
        // Đọc file markdown
        console.log('📖 Đang đọc file markdown...');
        const markdownContent = fs.readFileSync('docs/Deployment_Guide.docx.md', 'utf8');
        console.log('✅ Đã đọc file markdown, độ dài:', markdownContent.length);
        
        // Tạo document mới
        console.log('📄 Đang tạo document Word...');
        const children = [];

        // Parse markdown và chuyển đổi thành Word format
        const lines = markdownContent.split('\n');
        let paragraphCount = 0;
        
        console.log('🔄 Đang xử lý', lines.length, 'dòng...');
        
        for (let line of lines) {
            line = line.trim();
            
            if (line.startsWith('# ')) {
                // Main title
                children.push(
                    new Paragraph({
                        text: line.substring(2),
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER
                    })
                );
                paragraphCount++;
            } else if (line.startsWith('## ')) {
                // Section heading
                children.push(
                    new Paragraph({
                        text: line.substring(3),
                        heading: HeadingLevel.HEADING_1
                    })
                );
                paragraphCount++;
            } else if (line.startsWith('### ')) {
                // Subsection heading
                children.push(
                    new Paragraph({
                        text: line.substring(4),
                        heading: HeadingLevel.HEADING_2
                    })
                );
                paragraphCount++;
            } else if (line.startsWith('#### ')) {
                // Sub-subsection heading
                children.push(
                    new Paragraph({
                        text: line.substring(5),
                        heading: HeadingLevel.HEADING_3
                    })
                );
                paragraphCount++;
            } else if (line.startsWith('- **') && line.includes('**:')) {
                // Bold list item
                const parts = line.split('**:');
                if (parts.length === 2) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: parts[0].substring(3) + ':',
                                    bold: true
                                }),
                                new TextRun({
                                    text: parts[1],
                                    size: 24
                                })
                            ]
                        })
                    );
                    paragraphCount++;
                }
            } else if (line.startsWith('- ')) {
                // Regular list item
                children.push(
                    new Paragraph({
                        text: line.substring(2),
                        bullet: {
                            level: 0
                        }
                    })
                );
                paragraphCount++;
            } else if (line.startsWith('```')) {
                // Code block - skip for now
                continue;
            } else if (line === '---') {
                // Horizontal rule
                children.push(
                    new Paragraph({
                        text: '_________________________________________________________________',
                        alignment: AlignmentType.CENTER
                    })
                );
                paragraphCount++;
            } else if (line.length > 0) {
                // Regular paragraph
                children.push(
                    new Paragraph({
                        text: line,
                        size: 24
                    })
                );
                paragraphCount++;
            } else {
                // Empty line
                children.push(
                    new Paragraph({
                        text: '',
                        spacing: {
                            after: 200
                        }
                    })
                );
                paragraphCount++;
            }
        }

        console.log('📝 Đã tạo', paragraphCount, 'paragraphs');

        // Tạo document với children
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        // Tạo file Word
        console.log('💾 Đang tạo file Word...');
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync('docs/Deployment_Guide.docx', buffer);
        
        console.log('✅ Đã chuyển đổi thành công sang file Word: docs/Deployment_Guide.docx');
        console.log('📁 File size:', buffer.length, 'bytes');
        
    } catch (error) {
        console.error('❌ Lỗi khi chuyển đổi:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Chạy chuyển đổi
convertMarkdownToWord(); 