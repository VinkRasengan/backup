#!/bin/bash

# Firestore Indexes Deployment Script
# This script deploys the new indexes for Sprint 2 features

echo "🚀 Deploying Firestore indexes for Sprint 2..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Backup current indexes
echo "📋 Backing up current indexes..."
cp firestore.indexes.json firestore.indexes.backup.json
echo "✅ Current indexes backed up to firestore.indexes.backup.json"

# Replace with new indexes
echo "🔄 Updating indexes file..."
cp firestore.indexes.new.json firestore.indexes.json
echo "✅ Indexes file updated"

# Deploy indexes
echo "🚀 Deploying indexes to Firestore..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Indexes deployed successfully!"
    echo ""
    echo "📊 New indexes include:"
    echo "   - votes: linkId + userId (for checking user votes)"
    echo "   - votes: linkId + createdAt (for vote history)"
    echo "   - comments: linkId + createdAt (for comment threads)"
    echo "   - comments: userId + createdAt (for user comments)"
    echo "   - reports: status + createdAt (for admin filtering)"
    echo "   - reports: category + createdAt (for report categorization)"
    echo "   - reports: userId + createdAt (for user reports)"
    echo "   - admin_notifications: isRead + createdAt (for admin dashboard)"
    echo ""
    echo "⏱️  Note: Index creation may take a few minutes to complete."
    echo "🔗 Monitor progress at: https://console.firebase.google.com"
else
    echo "❌ Failed to deploy indexes. Restoring backup..."
    cp firestore.indexes.backup.json firestore.indexes.json
    echo "🔄 Backup restored"
    exit 1
fi

echo ""
echo "🎉 Firestore indexes deployment completed!"
echo "✨ Ready for Sprint 2 features!"
