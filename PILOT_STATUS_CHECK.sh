#!/bin/bash

# Protega CloudPay - Pilot Status Check Script

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "       PROTEGA CLOUDPAY - PILOT STATUS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Status counters
PASS=0
FAIL=0

# Check function
check() {
    local name="$1"
    local command="$2"
    
    echo -n "Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAIL++))
        return 1
    fi
}

# System Checks
echo -e "${BLUE}═══ SYSTEM HEALTH ═══${NC}"
check "API Service" "curl -s http://localhost:8000/ | grep -q 'Protega CloudPay API'"
check "Frontend Service" "curl -s http://localhost:3000/ | grep -q 'DOCTYPE'"
check "Database Connection" "docker exec protega-db pg_isready -U protega"
echo ""

# API Endpoint Checks
echo -e "${BLUE}═══ API ENDPOINTS ═══${NC}"
check "Health Endpoint" "curl -s http://localhost:8000/ | grep -q 'status'"
check "API Docs" "curl -s http://localhost:8000/docs | grep -q 'Swagger'"
check "Users Endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/users/1/payment-methods | grep -q '200\|404'"
echo ""

# Database Checks
echo -e "${BLUE}═══ DATABASE STATE ═══${NC}"
USERS=$(docker exec protega-db psql -U protega -d protega -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
MERCHANTS=$(docker exec protega-db psql -U protega -d protega -t -c "SELECT COUNT(*) FROM merchants;" 2>/dev/null | tr -d ' ')
TRANSACTIONS=$(docker exec protega-db psql -U protega -d protega -t -c "SELECT COUNT(*) FROM transactions;" 2>/dev/null | tr -d ' ')
PAYMENT_METHODS=$(docker exec protega-db psql -U protega -d protega -t -c "SELECT COUNT(*) FROM payment_methods;" 2>/dev/null | tr -d ' ')

echo -e "  Users:           ${GREEN}${USERS}${NC}"
echo -e "  Merchants:       ${GREEN}${MERCHANTS}${NC}"
echo -e "  Transactions:    ${GREEN}${TRANSACTIONS}${NC}"
echo -e "  Payment Methods: ${GREEN}${PAYMENT_METHODS}${NC}"
echo ""

# Docker Containers
echo -e "${BLUE}═══ DOCKER CONTAINERS ═══${NC}"
docker ps --filter "name=protega" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | while IFS= read -r line; do
    if echo "$line" | grep -q "Up"; then
        echo -e "${GREEN}✓${NC} $line"
    else
        echo "$line"
    fi
done
echo ""

# Recent API Errors
echo -e "${BLUE}═══ RECENT API ERRORS ═══${NC}"
ERROR_COUNT=$(docker logs protega-api --tail 100 2>&1 | grep -c "ERROR" 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✓ No errors in last 100 log lines${NC}"
else
    echo -e "${YELLOW}⚠ Found ${ERROR_COUNT} errors in last 100 log lines${NC}"
    docker logs protega-api --tail 100 2>&1 | grep "ERROR" | tail -3
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "               SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Checks Passed: ${GREEN}${PASS}${NC}"
echo -e "Checks Failed: ${RED}${FAIL}${NC}"

if [ "$FAIL" -eq "0" ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}       ✓ SYSTEM READY FOR PILOT TESTING ✓${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Review PILOT_LAUNCH_PACKAGE.md"
    echo "  2. Share PILOT_QUICK_START.md with participants"
    echo "  3. Begin Phase 1: Setup & Training"
    echo ""
    echo "🔗 Quick Links:"
    echo "  Frontend:  http://localhost:3000"
    echo "  Dashboard: http://localhost:3000/merchant/login"
    echo "  Enroll:    http://localhost:3000/enroll"
    echo "  Kiosk:     http://localhost:3000/kiosk"
    echo "  API Docs:  http://localhost:8000/docs"
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}       ✗ ISSUES DETECTED - FIX BEFORE LAUNCH ✗${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please resolve the failed checks above before starting pilot."
fi

echo ""

