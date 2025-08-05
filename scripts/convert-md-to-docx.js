#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Script to convert Markdown files to DOCX format using Pandoc
 * Usage: node convert-md-to-docx.js [input-file] [output-file]
 */

function convertMarkdownToDocx(inputFile, outputFile) {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Build pandoc command
    const pandocCommand = [
      'pandoc',
      `"${inputFile}"`,
      '-o', `"${outputFile}"`,
      '--from', 'markdown',
      '--to', 'docx',
      '--reference-doc', path.join(__dirname, 'reference.docx'), // Optional: custom reference document
      '--metadata', 'title="Hướng Dẫn Sử Dụng FactCheck Platform"',
      '--metadata', 'author="FactCheck Platform Team"',
      '--metadata', 'date="2024"',
      '--toc', // Add table of contents
      '--toc-depth=3', // TOC depth
      '--number-sections', // Number sections
      '--standalone' // Create standalone document
    ].join(' ');

    console.log('🔄 Converting Markdown to DOCX...');
    console.log(`📁 Input: ${inputFile}`);
    console.log(`📁 Output: ${outputFile}`);
    console.log(`🔧 Command: ${pandocCommand}`);

    // Execute pandoc command
    execSync(pandocCommand, { 
      stdio: 'inherit',
      shell: true 
    });

    console.log('✅ Conversion completed successfully!');
    console.log(`📄 Document saved as: ${outputFile}`);

    // Check if output file was created
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.error('❌ Output file was not created');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    
    // Check if pandoc is installed
    try {
      execSync('pandoc --version', { stdio: 'ignore' });
    } catch (pandocError) {
      console.error('❌ Pandoc is not installed or not in PATH');
      console.log('📥 Please install Pandoc from: https://pandoc.org/installing.html');
      console.log('💡 For Windows, you can also run: pandoc-installer.msi');
    }
    
    process.exit(1);
  }
}

function createReferenceDoc() {
  const referencePath = path.join(__dirname, 'reference.docx');
  
  if (!fs.existsSync(referencePath)) {
    console.log('📝 Creating reference document for better formatting...');
    
    const referenceCommand = [
      'pandoc',
      '--print-default-data-file', 'reference.docx',
      '>', `"${referencePath}"`
    ].join(' ');

    try {
      execSync(referenceCommand, { stdio: 'ignore', shell: true });
      console.log('✅ Reference document created');
    } catch (error) {
      console.log('⚠️ Could not create reference document, using default formatting');
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  
  // Default values
  let inputFile = path.join(__dirname, '..', 'docs', 'User_Guide.md');
  let outputFile = path.join(__dirname, '..', 'docs', 'User_Guide.docx');

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
📖 Markdown to DOCX Converter

Usage: node convert-md-to-docx.js [input-file] [output-file]

Arguments:
  input-file    Path to input Markdown file (default: docs/User_Guide.md)
  output-file   Path to output DOCX file (default: docs/User_Guide.docx)

Examples:
  node convert-md-to-docx.js
  node convert-md-to-docx.js docs/User_Guide.md
  node convert-md-to-docx.js docs/User_Guide.md docs/User_Guide_Final.docx

Requirements:
  - Pandoc must be installed and available in PATH
  - For Windows: run pandoc-installer.msi
  - For other systems: https://pandoc.org/installing.html
    `);
    return;
  }

  console.log('🚀 Starting Markdown to DOCX conversion...');
  console.log('📋 FactCheck Platform User Guide Converter');
  console.log('');

  // Create reference document if needed
  createReferenceDoc();

  // Convert the file
  convertMarkdownToDocx(inputFile, outputFile);

  console.log('');
  console.log('🎉 Conversion process completed!');
  console.log('📚 Your User Guide is ready in DOCX format.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { convertMarkdownToDocx }; 