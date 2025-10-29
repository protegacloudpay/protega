#!/bin/bash

echo "🚀 Protega CloudPay - Quick GitHub Push"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${BLUE}Initializing git...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
else
    echo -e "${GREEN}✓ Git already initialized${NC}"
fi

# Check if files are committed
if git rev-parse HEAD >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Files already committed${NC}"
else
    echo -e "${BLUE}Adding and committing files...${NC}"
    git add .
    git commit -m "Initial commit - Protega CloudPay"
    echo -e "${GREEN}✓ Files committed${NC}"
fi

# Set branch to main
git branch -M main

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Now I need 3 things from you:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get username
echo -e "${BLUE}1. What is your GitHub username?${NC}"
read -p "   Username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}Error: Username is required${NC}"
    exit 1
fi

# Check if remote exists
if git remote | grep -q origin; then
    echo -e "${YELLOW}   (Updating existing remote)${NC}"
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/protega-cloudpay.git"
else
    git remote add origin "https://github.com/$GITHUB_USERNAME/protega-cloudpay.git"
fi

echo -e "${GREEN}✓ Remote configured${NC}"
echo ""

# Instructions for creating repo
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}2. Create the repository (if you haven't):${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   a. Open: ${BLUE}https://github.com/new${NC}"
echo "   b. Repository name: ${GREEN}protega-cloudpay${NC}"
echo "   c. Leave everything else DEFAULT"
echo "   d. Click 'Create repository'"
echo ""
read -p "   Press Enter when done..."
echo ""

# Instructions for token
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}3. Create access token (if you haven't):${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   a. Open: ${BLUE}https://github.com/settings/tokens${NC}"
echo "   b. Click 'Generate new token (classic)'"
echo "   c. Name: ${GREEN}Protega${NC}"
echo "   d. Check: ${GREEN}repo${NC} and ${GREEN}workflow${NC}"
echo "   e. Click 'Generate token' (bottom)"
echo "   f. COPY the token (starts with ghp_)"
echo ""
read -p "   Press Enter when ready..."
echo ""

# Push
echo -e "${BLUE}Pushing to GitHub...${NC}"
echo -e "${YELLOW}When prompted:${NC}"
echo "  Username: $GITHUB_USERNAME"
echo "  Password: (paste your token)"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ SUCCESS! Code is on GitHub!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "View your code at:"
    echo "${BLUE}https://github.com/$GITHUB_USERNAME/protega-cloudpay${NC}"
    echo ""
    echo "Next step: Deploy to Railway + Vercel"
    echo "See: ${GREEN}DEPLOY_NOW.md${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}Push failed. Common issues:${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1. Repository doesn't exist"
    echo "   → Go to https://github.com/new"
    echo "   → Create 'protega-cloudpay'"
    echo ""
    echo "2. Wrong username"
    echo "   → Check: https://github.com/$GITHUB_USERNAME"
    echo ""
    echo "3. Wrong token or no 'repo' permission"
    echo "   → Create new: https://github.com/settings/tokens"
    echo ""
    echo "Run this script again: ./quick_push.sh"
    echo ""
fi
