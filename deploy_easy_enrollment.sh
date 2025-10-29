#!/bin/bash

# Deploy Easy Enrollment Features
# Run this script to deploy the new card reader & bank account enrollment

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Deploying Easy Enrollment Features"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the Protega root directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
cd frontend
npm install --silent

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

echo "🔨 Step 2: Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

echo "🚀 Step 3: Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 New features deployed:"
echo "   • 💳 Card reader enrollment (universal POS support)"
echo "   • 🏦 Bank account linking (Plaid integration)"
echo "   • ⌨️ Manual entry (backup method)"
echo ""
echo "📱 Test the new enrollment page:"
echo "   https://your-app.vercel.app/enroll-pro"
echo ""
echo "📖 Documentation:"
echo "   • EASY_ENROLLMENT.md - Feature overview & testing"
echo "   • MERCHANT_SETUP_GUIDE.md - Store setup instructions"
echo ""
echo "🧪 Quick test:"
echo "   1. Open /enroll-pro"
echo "   2. Try card reader method (simulated)"
echo "   3. Complete enrollment with fingerprint: test123"
echo "   4. Test payment at /terminal"
echo ""
echo "🎊 Ready for pilot launch!"
echo ""


