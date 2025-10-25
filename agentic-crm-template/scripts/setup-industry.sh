#!/bin/bash

# Industry Setup Script
# This script sets up your CRM for a specific industry

set -e  # Exit on error

echo "🎯 Industry CRM Setup Wizard"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if config directory exists
if [ ! -d "config" ]; then
    echo -e "${RED}Error: config directory not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# Function to list available industries
list_industries() {
    echo -e "${BLUE}Available Industry Templates:${NC}"
    echo ""
    local i=1
    for file in config/industries/*.json; do
        if [ -f "$file" ]; then
            local basename=$(basename "$file" .json)
            local displayName=$(jq -r '.industry.displayName' "$file")
            local description=$(jq -r '.industry.description' "$file")
            echo "  $i) $displayName"
            echo "     $description"
            echo ""
            i=$((i+1))
        fi
    done
}

# Function to copy industry config
setup_industry() {
    local industry_file=$1

    echo -e "${YELLOW}Setting up industry configuration...${NC}"

    # Copy industry config to active config
    cp "$industry_file" config/industry.json

    echo -e "${GREEN}✓ Industry configuration copied${NC}"
}

# Function to generate theme files
generate_theme() {
    echo -e "${YELLOW}Generating theme files...${NC}"

    if [ -f "scripts/generate-theme.js" ]; then
        node scripts/generate-theme.js
        echo -e "${GREEN}✓ Theme files generated${NC}"
    else
        echo -e "${YELLOW}⚠ Theme generator not found, skipping${NC}"
    fi
}

# Function to update package.json
update_package_json() {
    local industry_name=$1

    echo -e "${YELLOW}Updating package.json...${NC}"

    if command -v jq &> /dev/null; then
        local display_name=$(jq -r '.industry.displayName' config/industry.json)
        jq --arg name "$display_name CRM" '.name = $name' package.json > package.json.tmp
        mv package.json.tmp package.json
        echo -e "${GREEN}✓ Package name updated${NC}"
    else
        echo -e "${YELLOW}⚠ jq not installed, skipping package.json update${NC}"
    fi
}

# Function to create .env if it doesn't exist
setup_env() {
    echo -e "${YELLOW}Checking environment configuration...${NC}"

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Created .env from template${NC}"
            echo -e "${YELLOW}⚠ Please update .env with your configuration${NC}"
        else
            echo -e "${YELLOW}⚠ No .env.example found${NC}"
        fi
    else
        echo -e "${GREEN}✓ .env already exists${NC}"
    fi
}

# Main menu
main() {
    echo "This wizard will help you set up your CRM for a specific industry."
    echo ""

    # Check for jq
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠ Warning: jq is not installed${NC}"
        echo "Some features may not work. Install with:"
        echo "  macOS: brew install jq"
        echo "  Ubuntu: sudo apt install jq"
        echo ""
    fi

    # List available industries
    list_industries

    # Get user selection
    echo -e "${BLUE}Select an industry (enter number or filename):${NC}"
    read -p "> " selection

    # Determine selected file
    local selected_file=""

    # If numeric selection
    if [[ "$selection" =~ ^[0-9]+$ ]]; then
        local files=(config/industries/*.json)
        local index=$((selection-1))
        if [ $index -ge 0 ] && [ $index -lt ${#files[@]} ]; then
            selected_file="${files[$index]}"
        fi
    # If filename provided
    elif [ -f "config/industries/${selection}.json" ]; then
        selected_file="config/industries/${selection}.json"
    elif [ -f "$selection" ]; then
        selected_file="$selection"
    fi

    # Validate selection
    if [ -z "$selected_file" ] || [ ! -f "$selected_file" ]; then
        echo -e "${RED}Error: Invalid selection${NC}"
        exit 1
    fi

    # Display selected industry
    local display_name=$(jq -r '.industry.displayName' "$selected_file")
    echo ""
    echo -e "${GREEN}Selected: $display_name${NC}"
    echo ""

    # Confirm
    read -p "Continue with this industry? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi

    echo ""
    echo "Starting setup..."
    echo ""

    # Run setup steps
    setup_industry "$selected_file"
    generate_theme
    update_package_json
    setup_env

    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Setup Complete!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update .env with your configuration"
    echo "  2. Customize theme in config/theme.json"
    echo "  3. Add branding assets to public/assets/"
    echo "  4. Run: npm install"
    echo "  5. Run: npm run dev"
    echo ""
    echo "Documentation:"
    echo "  - Entity Mapping: docs/ENTITY_MAPPING_GUIDE.md"
    echo "  - Theme Guide: docs/THEME_GUIDE.md"
    echo "  - Deployment: docs/DEPLOYMENT_GUIDE.md"
    echo ""
}

# Run main function
main
