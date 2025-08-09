import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from 'fs';
import path from 'path';

function validateDocxFile() {
    try {
        console.log('🔍 Validating DOCX file...');
        
        const docxPath = path.join(__dirname, '..', 'docs', 'User_Guide.docx');
        
        // Check if file exists
        if (!fs.existsSync(docxPath)) {
            console.error('❌ DOCX file not found!');
            return false;
        }
        
        // Get file stats
        const stats = fs.statSync(docxPath);
        const fileSize = stats.size;
        
        console.log(`📁 File path: ${docxPath}`);
        console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024).toFixed(2)} KB)`);
        console.log(`📅 Created: ${stats.birthtime}`);
        console.log(`📅 Modified: ${stats.mtime}`);
        
        // Check if file is not empty
        if (fileSize === 0) {
            console.error('❌ File is empty!');
            return false;
        }
        
        // Check if file size is reasonable (should be at least 1KB for a proper DOCX)
        if (fileSize < 1024) {
            console.warn('⚠️ File size seems too small for a DOCX file');
        }
        
        // Read first few bytes to check DOCX signature
        const buffer = fs.readFileSync(docxPath);
        const signature = buffer.slice(0, 4);
        
        // DOCX files start with PK (ZIP format)
        if (signature[0] === 0x50 && signature[1] === 0x4B) {
            console.log('✅ File has valid DOCX signature (ZIP format)');
        } else {
            console.error('❌ File does not have valid DOCX signature!');
            console.log(`🔍 First bytes: ${signature.toString('hex')}`);
            return false;
        }
        
        // Check for required DOCX structure
        const content = buffer.toString('binary');
        
        // Check for common DOCX elements
        const hasWordDocument = content.includes('word/document.xml');
        const hasContentTypes = content.includes('[Content_Types].xml');
        const hasRelationships = content.includes('_rels/.rels');
        
        console.log(`📄 Contains word/document.xml: ${hasWordDocument ? '✅' : '❌'}`);
        console.log(`📄 Contains [Content_Types].xml: ${hasContentTypes ? '✅' : '❌'}`);
        console.log(`📄 Contains _rels/.rels: ${hasRelationships ? '✅' : '❌'}`);
        
        if (hasWordDocument && hasContentTypes && hasRelationships) {
            console.log('✅ DOCX file structure appears valid');
        } else {
            console.error('❌ DOCX file structure is invalid!');
            return false;
        }
        
        console.log('🎉 DOCX file validation completed successfully!');
        console.log('📝 The file should now open properly in Microsoft Word');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error validating DOCX file:', error);
        return false;
    }
}

// Run validation
validateDocxFile(); 