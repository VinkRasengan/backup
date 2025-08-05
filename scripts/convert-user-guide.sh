#!/bin/bash

# FactCheck Platform - User Guide Converter
# For Linux and macOS users

echo "========================================"
echo "  FactCheck Platform - User Guide Converter"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo "📥 Please install Node.js from: https://nodejs.org/"
    echo "   For Ubuntu/Debian: sudo apt install nodejs npm"
    echo "   For macOS: brew install node"
    exit 1
fi

print_status "Node.js is installed ($(node --version))"

# Check if Pandoc is installed
if ! command -v pandoc &> /dev/null; then
    print_error "Pandoc is not installed or not in PATH"
    echo "📥 Please install Pandoc from: https://pandoc.org/installing.html"
    echo "   For Ubuntu/Debian: sudo apt install pandoc"
    echo "   For macOS: brew install pandoc"
    echo "   For CentOS/RHEL: sudo yum install pandoc"
    exit 1
fi

print_status "Pandoc is installed ($(pandoc --version | head -n 1))"

# Check if input file exists
INPUT_FILE="../docs/User_Guide.md"
if [ ! -f "$INPUT_FILE" ]; then
    print_error "Input file not found: $INPUT_FILE"
    echo "Please make sure the User_Guide.md file exists in the docs directory"
    exit 1
fi

print_status "Input file found: $INPUT_FILE"

# Create output directory if it doesn't exist
OUTPUT_DIR="../docs"
mkdir -p "$OUTPUT_DIR"

# Run the conversion script
echo
print_info "Starting conversion..."
node convert-md-to-docx.js

if [ $? -eq 0 ]; then
    echo
    print_status "Conversion completed successfully!"
    echo "📄 User Guide saved as: docs/User_Guide.docx"
    echo
    echo "🎉 You can now open the DOCX file in Microsoft Word, LibreOffice, or any compatible editor."
    
    # Show file size
    if [ -f "../docs/User_Guide.docx" ]; then
        FILE_SIZE=$(du -h "../docs/User_Guide.docx" | cut -f1)
        echo "📊 File size: $FILE_SIZE"
    fi
else
    echo
    print_error "Conversion failed. Please check the error messages above."
    exit 1
fi

echo 