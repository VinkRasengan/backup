#!/bin/bash

# Email Verification Feature Test Script
# This script helps test the email verification functionality

echo "🧪 Email Verification Feature Test Guide"
echo "========================================"
echo ""

echo "📋 Test Checklist:"
echo ""

echo "1. ✅ Registration Flow Test"
echo "   - Go to http://localhost:3000/register"
echo "   - Register a new user"
echo "   - Check that verification email is sent (check emulator logs)"
echo "   - Verify redirect to login with success message"
echo ""

echo "2. ✅ Login Without Verification Test"
echo "   - Go to http://localhost:3000/login"
echo "   - Login with unverified account"
echo "   - Check that EmailVerificationBanner appears on dashboard"
echo "   - Try to access http://localhost:3000/check-link"
echo "   - Should redirect to /email-verification-required"
echo ""

echo "3. ✅ Email Verification Test"
echo "   - Copy verification link from Firebase emulator logs"
echo "   - Paste link in browser"
echo "   - Should show success message on /verify-email page"
echo "   - Return to dashboard - banner should disappear"
echo "   - Should now be able to access /check-link"
echo ""

echo "4. ✅ Resend Verification Test"
echo "   - With unverified account, click 'Resend' in banner"
echo "   - Or go to /email-verification-required and click resend"
echo "   - Check emulator logs for new verification email"
echo "   - Test rate limiting by clicking multiple times quickly"
echo ""

echo "5. ✅ Route Protection Test"
echo "   - Test /dashboard (should work for all authenticated users)"
echo "   - Test /profile (should work for all authenticated users)"
echo "   - Test /check-link (should require email verification)"
echo ""

echo "🚀 Starting Development Server..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backup directory"
    exit 1
fi

# Start the development environment
echo "Starting Firebase emulators and development servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all processes..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start Firebase emulators in background
echo "🔥 Starting Firebase emulators..."
npm run emulators &
EMULATOR_PID=$!

# Wait a bit for emulators to start
sleep 5

# Start development servers
echo "🖥️  Starting development servers..."
npm run dev &
DEV_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Application URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - Firebase Emulator UI: http://localhost:4000"
echo ""
echo "📧 Email Verification Links:"
echo "   - Check Firebase Auth emulator logs at http://localhost:4000"
echo "   - Look for verification emails in the logs"
echo "   - Copy the action links to test verification"
echo ""
echo "🧪 Test the features listed above!"
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
