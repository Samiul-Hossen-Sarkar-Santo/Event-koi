#!/bin/bash
echo "Setting up Firebase deployment structure..."

# Create directories
mkdir -p functions
mkdir -p public/css
mkdir -p public/js
mkdir -p public/uploads

# Copy static files to public
echo "Copying static files..."
cp *.html public/ 2>/dev/null || true
cp -r css/* public/css/ 2>/dev/null || true
cp -r js/* public/js/ 2>/dev/null || true
cp -r uploads/* public/uploads/ 2>/dev/null || true

# Copy backend files to functions
echo "Copying backend files..."
cp server-production.js functions/ 2>/dev/null || true
cp -r routes functions/ 2>/dev/null || true
cp -r models functions/ 2>/dev/null || true

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up MongoDB Atlas (see COMPLETE_MIGRATION_GUIDE.md)"
echo "2. Update functions/server-production.js with Firebase config"
echo "3. Run 'firebase deploy' to deploy"
echo ""
echo "Don't forget to set Firebase environment variables:"
echo "firebase functions:config:set mongodb.uri=\"your-atlas-connection-string\""
echo "firebase functions:config:set session.secret=\"your-session-secret\""
