#!/bin/bash
# Protega CloudPay - GitHub Setup Script

set -e

echo "🚀 Protega CloudPay - GitHub Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if git is installed
echo -e "${BLUE}📋 Checking git installation...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git not found. Installing via Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install git
fi
echo -e "${GREEN}✓ Git is installed${NC}"
echo ""

# Step 2: Get GitHub username
echo -e "${BLUE}📝 Enter your GitHub username:${NC}"
read -p "Username: " GITHUB_USERNAME
echo ""

# Step 3: Initialize git
echo -e "${BLUE}🔧 Initializing git repository...${NC}"
git init
echo -e "${GREEN}✓ Git initialized${NC}"
echo ""

# Step 4: Add all files
echo -e "${BLUE}📦 Adding all files...${NC}"
git add .
echo -e "${GREEN}✓ Files staged${NC}"
echo ""

# Step 5: Commit
echo -e "${BLUE}💾 Creating initial commit...${NC}"
git commit -m "Initial commit - Protega CloudPay with markup fee and multi-card support"
echo -e "${GREEN}✓ Files committed${NC}"
echo ""

# Step 6: Add remote
echo -e "${BLUE}🔗 Adding GitHub remote...${NC}"
git remote add origin "https://github.com/$GITHUB_USERNAME/protega-cloudpay.git"
echo -e "${GREEN}✓ Remote added${NC}"
echo ""

# Step 7: Rename branch to main
echo -e "${BLUE}🌿 Renaming branch to main...${NC}"
git branch -M main
echo -e "${GREEN}✓ Branch renamed${NC}"
echo ""

# Step 8: Instructions for pushing
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚡ NEXT STEPS:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}1. Create GitHub repository:${NC}"
echo "   → Go to: https://github.com/new"
echo "   → Name: protega-cloudpay"
echo "   → Public or Private"
echo "   → DON'T initialize with README"
echo "   → Click 'Create repository'"
echo ""
echo -e "${BLUE}2. Create Personal Access Token:${NC}"
echo "   → Go to: https://github.com/settings/tokens"
echo "   → Click 'Generate new token (classic)'"
echo "   → Name: 'Protega Deploy'"
echo "   → Select scopes: repo, workflow"
echo "   → Click 'Generate token'"
echo "   → COPY THE TOKEN (you won't see it again!)"
echo ""
echo -e "${BLUE}3. Push to GitHub:${NC}"
echo "   → Run: git push -u origin main"
echo "   → Username: $GITHUB_USERNAME"
echo "   → Password: <paste your token>"
echo ""
echo -e "${GREEN}✓ Git is ready! Complete steps above, then run:${NC}"
echo ""
echo -e "${YELLOW}   git push -u origin main${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

