# 📚 Documentation

This directory contains all documentation for the FactCheck Anti-Fraud Platform.

## 📋 Files

### User Documentation
- **`USAGE-GUIDE.md`** - Comprehensive user guide in Markdown format
- **`User_Guide.docx`** - User guide converted to Microsoft Word format
- **`User_Guide.md`** - Original user guide (legacy)

### Technical Documentation
- **`README.md`** - This file
- **`SCRIPTS_REFERENCE.md`** - Reference for all available scripts
- **`Deployment_Guide.docx.md`** - Deployment guide in Markdown
- **`User_Guide_Simple.docx`** - Simplified user guide

## 🚀 Quick Commands

### Generate User Guide DOCX
```bash
# Generate and validate DOCX file
npm run docs:generate

# Convert only (without validation)
npm run docs:convert

# Validate existing DOCX file
npm run docs:validate
```

### Manual Generation
```bash
# Direct script execution
node scripts/generate-user-guide.js
node scripts/convert-usage-guide-to-docx.js
node scripts/validate-docx.js
```

## 📝 Content Overview

### User Guide Features
- **Complete Installation Guide** - Step-by-step setup instructions
- **System Requirements** - Hardware and software requirements
- **Usage Instructions** - How to use all platform features
- **Troubleshooting** - Common issues and solutions
- **Video Tutorial Link** - YouTube video for visual guidance
- **Community Guidelines** - Rules and best practices
- **Security Information** - Privacy and security details

### Technical Features
- **Multi-format Support** - Markdown and DOCX formats
- **Professional Layout** - Proper formatting and structure
- **Validation** - Automatic file integrity checks
- **Version Control** - Tracked changes and updates

## 🔧 Script Details

### `generate-user-guide.js`
Main script that:
1. Converts `USAGE-GUIDE.md` to DOCX format
2. Validates the generated file
3. Provides detailed output and status

### `convert-usage-guide-to-docx.js`
Converts markdown to DOCX with:
- Professional formatting
- Title page
- Table of contents
- Proper styling and colors
- Page breaks and sections

### `validate-docx.js`
Validates DOCX file integrity:
- File existence and size
- DOCX signature verification
- Internal structure validation
- Content verification

## 📊 File Specifications

### DOCX Output
- **Format**: Microsoft Word (.docx)
- **Size**: ~17 KB
- **Pages**: Multiple pages with proper formatting
- **Features**: 
  - Title page
  - Table of contents
  - Professional styling
  - Hyperlinks
  - Code blocks
  - Lists and numbering

### Markdown Source
- **Format**: GitHub-flavored Markdown
- **Encoding**: UTF-8
- **Features**:
  - Emojis and icons
  - Code blocks
  - Tables
  - Links
  - Lists

## 🎯 Usage Scenarios

### For End Users
1. Download `User_Guide.docx`
2. Open in Microsoft Word
3. Follow the step-by-step instructions
4. Watch the included video tutorial

### For Developers
1. Edit `USAGE-GUIDE.md` for content changes
2. Run `npm run docs:generate` to update DOCX
3. Commit both files to version control
4. Share updated documentation

### For Documentation Team
1. Maintain `USAGE-GUIDE.md` as the source of truth
2. Use scripts for consistent formatting
3. Validate all generated files
4. Update video links and references

## 🔄 Update Process

### When to Update
- New features added to platform
- UI/UX changes
- Bug fixes that affect user workflow
- System requirement changes
- Video tutorial updates

### Update Steps
1. **Edit Source**: Modify `USAGE-GUIDE.md`
2. **Generate**: Run `npm run docs:generate`
3. **Validate**: Check output and file integrity
4. **Test**: Open DOCX in Word to verify formatting
5. **Commit**: Save both files to repository

## 🛠️ Troubleshooting

### Common Issues

#### DOCX Won't Open
```bash
# Validate file integrity
npm run docs:validate

# Regenerate if needed
npm run docs:generate
```

#### Formatting Issues
- Check markdown syntax in source file
- Ensure proper heading structure
- Verify emoji compatibility

#### Large File Size
- Check for embedded images
- Verify no unnecessary content
- Regenerate with clean source

### Error Messages

#### "DOCX file not found"
- Run `npm run docs:generate` first
- Check file permissions
- Verify output directory

#### "Invalid DOCX signature"
- File may be corrupted
- Regenerate the file
- Check disk space

#### "Conversion failed"
- Check markdown syntax
- Verify all dependencies installed
- Review error logs

## 📞 Support

For documentation issues:
1. Check this README first
2. Review error messages carefully
3. Try regenerating the file
4. Contact development team if needed

## 📈 Future Improvements

- [ ] Add PDF generation
- [ ] Include screenshots
- [ ] Multi-language support
- [ ] Interactive elements
- [ ] Version comparison tools
- [ ] Automated testing

---

*Last updated: August 2024*
*Version: 2.0*