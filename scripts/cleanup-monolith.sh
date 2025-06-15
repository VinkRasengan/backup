#!/bin/bash

# Cleanup old monolith code after microservices migration

set -e

echo "🧹 Cleaning up old monolith code..."
echo "=================================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Backup old files before deletion
echo "📦 Creating backup of old files..."
if [ ! -d "backup-monolith" ]; then
    mkdir backup-monolith
    
    # Backup server directory
    if [ -d "server" ]; then
        echo "  📁 Backing up server/ directory..."
        cp -r server backup-monolith/
    fi
    
    # Backup functions directory
    if [ -d "functions" ]; then
        echo "  📁 Backing up functions/ directory..."
        cp -r functions backup-monolith/
    fi
    
    # Backup old package files
    if [ -f "package.json" ]; then
        echo "  📄 Backing up root package.json..."
        cp package.json backup-monolith/package.json.old
    fi
    
    if [ -f "package-lock.json" ]; then
        echo "  📄 Backing up root package-lock.json..."
        cp package-lock.json backup-monolith/package-lock.json.old
    fi
    
    echo "✅ Backup created in backup-monolith/ directory"
else
    echo "⚠️  Backup directory already exists, skipping backup"
fi

# Ask for confirmation
echo ""
echo "⚠️  WARNING: This will permanently delete the following:"
echo "   - server/ directory (old backend)"
echo "   - functions/ directory (Firebase functions)"
echo "   - Root package.json and package-lock.json"
echo "   - Root node_modules/"
echo ""
echo "   Backup has been created in backup-monolith/ directory"
echo ""
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

# Remove old monolith files
echo ""
echo "🗑️  Removing old monolith files..."

if [ -d "server" ]; then
    echo "  🗂️  Removing server/ directory..."
    rm -rf server/
    echo "    ✅ server/ removed"
fi

if [ -d "functions" ]; then
    echo "  🗂️  Removing functions/ directory..."
    rm -rf functions/
    echo "    ✅ functions/ removed"
fi

if [ -f "package.json" ]; then
    echo "  📄 Removing root package.json..."
    rm package.json
    echo "    ✅ package.json removed"
fi

if [ -f "package-lock.json" ]; then
    echo "  📄 Removing root package-lock.json..."
    rm package-lock.json
    echo "    ✅ package-lock.json removed"
fi

if [ -d "node_modules" ]; then
    echo "  📦 Removing root node_modules/..."
    rm -rf node_modules/
    echo "    ✅ node_modules/ removed"
fi

# Remove other old files
old_files=(
    "firebase.json"
    ".firebaserc"
    "firestore.rules"
    "firestore.indexes.json"
)

for file in "${old_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  📄 Removing $file..."
        rm "$file"
        echo "    ✅ $file removed"
    fi
done

# Update main README to point to microservices
echo ""
echo "📝 Updating main README..."
if [ -f "README.md" ]; then
    mv README.md README_OLD.md
    mv README_MICROSERVICES.md README.md
    echo "  ✅ README updated to microservices version"
    echo "  📄 Old README saved as README_OLD.md"
fi

echo ""
echo "🎉 Cleanup completed successfully!"
echo ""
echo "📊 Summary:"
echo "  ✅ Old monolith code removed"
echo "  ✅ Backup created in backup-monolith/"
echo "  ✅ README updated to microservices version"
echo ""
echo "🚀 Your project is now fully migrated to microservices!"
echo ""
echo "Next steps:"
echo "  1. Deploy microservices: ./scripts/deploy-microservices.sh"
echo "  2. Access frontend: http://localhost:3000"
echo "  3. Access API Gateway: http://localhost:8080"
echo ""
