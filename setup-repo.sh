#!/bin/bash

# Setup script for Newsletter Generator repository

echo "Setting up Newsletter Generator repository..."

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "Error: Please run this script from the newsletter-generator directory"
    exit 1
fi

echo "Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/new"
echo "2. Repository name: newsletter-generator"
echo "3. Description: AI-powered Chrome extension for capturing and summarizing web content for internal newsletters"
echo "4. Make it Private"
echo "5. Do NOT initialize with README, .gitignore, or license (we already have these)"
echo "6. Click 'Create repository'"
echo "7. Run the following commands:"
echo ""
echo "   git remote set-url origin https://github.com/carryologist/newsletter-generator.git"
echo "   git push -u origin main"
echo ""
echo "Files ready to push:"
git status --porcelain
echo ""
echo "Total files: $(git ls-files | wc -l)"
echo "Last commit: $(git log -1 --oneline)"
