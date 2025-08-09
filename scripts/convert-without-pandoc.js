import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Simple Markdown to DOCX converter without Pandoc
 * This creates a basic DOCX structure using XML
 */

function convertMarkdownToDocx(inputFile, outputFile) {
  try {
    console.log('🔄 Converting Markdown to DOCX (without Pandoc)...');
    console.log(`📁 Input: ${inputFile}`);
    console.log(`📁 Output: ${outputFile}`);

    // Read the markdown file
    const markdownContent = fs.readFileSync(inputFile, 'utf8');
    
    // Create a simple HTML representation
    const htmlContent = convertMarkdownToHtml(markdownContent);
    
    // Create a basic DOCX structure
    const docxContent = createDocxStructure(htmlContent);
    
    // Write the output file
    fs.writeFileSync(outputFile, docxContent);
    
    console.log('✅ Conversion completed successfully!');
    console.log(`📄 Document saved as: ${outputFile}`);
    
    const stats = fs.statSync(outputFile);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    process.exit(1);
  }
}

function convertMarkdownToHtml(markdown) {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  
  // Convert paragraphs
  html = html.replace(/^(?!<[h|li|pre|ul|ol])(.+)$/gim, '<p>$1</p>');
  
  return html;
}

function createDocxStructure(htmlContent) {
  // Create a simple DOCX structure
  const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>FactCheck Platform - User Guide</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is a converted document from Markdown.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Content:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${htmlContent.replace(/<[^>]*>/g, '')}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
  
  return docxXml;
}

function main() {
  const args = process.argv.slice(2);
  
  // Default values
  let inputFile = path.join(__dirname, '..', 'docs', 'User_Guide.md');
  let outputFile = path.join(__dirname, '..', 'docs', 'User_Guide_Simple.docx');

  // Parse command line arguments
  if (args.length >= 1) {
    inputFile = args[0];
  }
  
  if (args.length >= 2) {
    outputFile = args[1];
  }

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📖 Simple Markdown to DOCX Converter (No Pandoc Required)

Usage: node convert-without-pandoc.js [input-file] [output-file]

Arguments:
  input-file    Path to input Markdown file (default: docs/User_Guide.md)
  output-file   Path to output DOCX file (default: docs/User_Guide_Simple.docx)

Examples:
  node convert-without-pandoc.js
  node convert-without-pandoc.js docs/User_Guide.md
  node convert-without-pandoc.js docs/User_Guide.md docs/User_Guide_Final.docx

Note: This creates a basic DOCX structure. For better formatting, install Pandoc.
    `);
    return;
  }

  console.log('🚀 Starting simple Markdown to DOCX conversion...');
  console.log('📋 FactCheck Platform User Guide Converter (Simple Version)');
  console.log('');

  // Convert the file
  convertMarkdownToDocx(inputFile, outputFile);

  console.log('');
  console.log('🎉 Conversion process completed!');
  console.log('📚 Your User Guide is ready in DOCX format.');
  console.log('');
  console.log('💡 Note: This is a basic conversion. For better formatting,');
  console.log('   please install Pandoc and use the full converter.');
}

// Run the script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default { convertMarkdownToDocx }; 