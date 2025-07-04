# Firebase Deployment Preparation Script

## Step 1: Set up MongoDB Atlas (Do this first!)
Follow the COMPLETE_MIGRATION_GUIDE.md file to:
1. Create MongoDB Atlas account
2. Set up cluster
3. Get connection string
4. Update your .env file

## Step 2: Test with Atlas locally
```bash
# Make sure your .env file has the Atlas connection string
node server.js
```
Visit http://localhost:3000 and test all functionality to ensure Atlas connection works.

## Step 3: Prepare Firebase Structure
```bash
# Create functions directory if it doesn't exist
mkdir functions

# Create public directory for static files
mkdir public

# Copy your static files to public directory
cp *.html public/
cp -r css public/
cp -r js public/
cp -r uploads public/
```

## Step 4: Set up Firebase Functions
```bash
cd functions

# Create package.json for functions
npm init -y

# Install dependencies
npm install express mongoose express-session dotenv

# Copy your backend files
cp ../server-production.js index.js
cp -r ../routes .
cp -r ../models .
```

## Step 5: Create Firebase Function Entry Point
Create `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const app = require('./server-production');

exports.api = functions.https.onRequest(app);
```

## Step 6: Configure Environment Variables
```bash
# Set MongoDB URI for Firebase Functions
firebase functions:config:set mongodb.uri="your-atlas-connection-string"
firebase functions:config:set session.secret="your-session-secret"
```

## Step 7: Update functions/server-production.js
Replace environment variables:
```javascript
// Instead of process.env.MONGODB_URI, use:
const config = functions.config();
const MONGODB_URI = config.mongodb.uri;
const SESSION_SECRET = config.session.secret;
```

## Step 8: Deploy to Firebase
```bash
# From your project root
firebase deploy
```

## Step 9: Update MongoDB Atlas Network Access
After deployment, add your Firebase hosting domain to MongoDB Atlas:
1. Go to MongoDB Atlas → Network Access
2. Add your Firebase app domain (e.g., your-app.web.app)

## Troubleshooting

### Common Issues:
1. **CORS errors**: Add proper CORS middleware to your Express app
2. **Session issues**: Make sure session configuration works with serverless functions
3. **File upload issues**: Use Firebase Storage instead of local file storage for uploads
4. **Path issues**: Ensure all paths are relative, not absolute

### Testing:
1. Test locally first: `firebase emulators:start`
2. Check Firebase Functions logs: `firebase functions:log`
3. Monitor Atlas connections in MongoDB Atlas dashboard

## File Upload Consideration
For production, consider using Firebase Storage for file uploads instead of local storage:
```javascript
const admin = require('firebase-admin');
const bucket = admin.storage().bucket();
```

This ensures uploaded files persist across function invocations.
