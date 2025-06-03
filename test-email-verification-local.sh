#!/bin/bash

# Local Email Verification Test Script
echo "🧪 Testing Email Verification Locally"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backup directory"
    exit 1
fi

echo "🔧 Setting up environment for email verification testing..."
echo ""

# Set environment variables for testing
export REACT_APP_USE_EMULATOR=true
export NODE_ENV=development

echo "📧 Email Verification Test Instructions:"
echo ""
echo "1. 🚀 Starting Firebase emulators..."

# Start Firebase emulators in background
firebase emulators:start &
EMULATOR_PID=$!

# Wait for emulators to start
echo "⏳ Waiting for emulators to start..."
sleep 10

echo ""
echo "2. 🖥️  Starting development server..."

# Start development server
cd client && npm start &
DEV_PID=$!

# Wait for dev server to start
sleep 5

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🌐 Test URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Firebase Emulator UI: http://localhost:4000"
echo "   - Auth Emulator: http://localhost:9099"
echo ""
echo "📧 Email Verification Test Steps:"
echo ""
echo "1. Open http://localhost:3000/register"
echo "2. Register a new user with any email"
echo "3. Check Firebase Auth Emulator at http://localhost:4000"
echo "4. Look for verification email in the emulator logs"
echo "5. Copy the verification link from logs"
echo "6. Test the verification link"
echo ""
echo "🔍 Debug Information:"
echo "   - Check browser console for logs"
echo "   - Look for 'Verification email sent successfully' message"
echo "   - Check Network tab for sendOobCode requests"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all processes..."
    kill $EMULATOR_PID 2>/dev/null
    kill $DEV_PID 2>/dev/null
    pkill -f "firebase emulators" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    echo "✅ Cleanup completed"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Wait for user to stop
wait
