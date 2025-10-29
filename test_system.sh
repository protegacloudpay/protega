#!/bin/bash

# Protega CloudPay - System Verification Script

echo "🔍 Protega CloudPay - System Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check API
echo -n "Checking API (port 8000)... "
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
    exit 1
fi

# Check Frontend
echo -n "Checking Frontend (port 3000)... "
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
    exit 1
fi

# Check Database
echo -n "Checking Database (port 5432)... "
if docker exec protega-db pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ready${NC}"
else
    echo -e "${RED}✗ Not ready${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All systems operational!${NC}"
echo ""
echo "📋 Quick Links:"
echo "  API Docs:    http://localhost:8000/docs"
echo "  Frontend:    http://localhost:3000"
echo "  Enroll:      http://localhost:3000/enroll"
echo "  Kiosk:       http://localhost:3000/kiosk"
echo "  Dashboard:   http://localhost:3000/merchant/dashboard"
echo ""
echo "📖 Follow the demo guide: OFFICIAL_DEMO_GUIDE.md"
echo ""

