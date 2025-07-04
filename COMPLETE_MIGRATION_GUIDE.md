# Complete Migration Guide: Local MongoDB to MongoDB Atlas + Firebase Hosting

## Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Visit https://www.mongodb.com/atlas
2. Click "Try Free" and create an account
3. Choose the **FREE M0 Sandbox** tier (512 MB storage, perfect for development)

### Step 2: Create Your Cluster
1. After account creation, click "Build a Database"
2. Choose "M0 FREE" tier
3. Select **AWS** as cloud provider
4. Choose a region closest to your users (e.g., US East, Europe, Asia)
5. Name your cluster: `event-koi-cluster`
6. Click "Create"

### Step 3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Username: `eventkoi-user`
5. Generate a strong password (save this!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. **For development**: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. **For production**: You'll need to add Firebase hosting IPs later
5. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version 4.1 or later
5. Copy the connection string (example):
   ```
   mongodb+srv://eventkoi-user:<password>@event-koi-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Part 2: Update Your Application

### Step 1: Update .env File
Replace your current .env content with:
```
MONGODB_URI=mongodb+srv://eventkoi-user:<YOUR_PASSWORD>@event-koi-cluster.xxxxx.mongodb.net/eventkoi?retryWrites=true&w=majority
SESSION_SECRET=your-strong-session-secret-here
```

### Step 2: Update server.js for Production
Your server.js needs modifications for Firebase hosting. Here's what needs to change:

1. **Remove absolute paths** (Firebase won't have E:/ drives)
2. **Add environment detection**
3. **Configure for Firebase Functions**

## Part 3: Migrate Your Data

### Option A: Using MongoDB Compass (Recommended)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to your local MongoDB: `mongodb://localhost:27017`
3. Export your `eventkoi` database collections
4. Connect to Atlas using your connection string
5. Import the collections to your Atlas cluster

### Option B: Using Command Line
```bash
# Export from local MongoDB
mongodump --host localhost:27017 --db eventkoi --out ./backup

# Import to Atlas
mongorestore --uri "mongodb+srv://eventkoi-user:<password>@event-koi-cluster.xxxxx.mongodb.net/eventkoi" ./backup/eventkoi
```

## Part 4: Firebase Hosting Setup

### Step 1: Prepare for Firebase
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init`

### Step 2: Configure Firebase Functions
Since you're using Node.js backend, you'll need Firebase Functions:

1. Select "Functions" and "Hosting" during firebase init
2. Choose JavaScript for Functions
3. Install dependencies in functions folder

### Step 3: Update Project Structure
Firebase hosting requires specific structure:
```
/public (your static files: HTML, CSS, JS, images)
/functions (your Node.js server code)
```

## Part 5: Test Everything

1. **Test locally with Atlas**:
   ```bash
   node server.js
   ```
2. **Test Firebase Functions locally**:
   ```bash
   firebase emulators:start
   ```
3. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## Important Notes:

1. **Never commit .env file** - Add it to .gitignore
2. **Use Firebase environment variables** for production
3. **Atlas M0 tier limitations**: 512MB storage, limited connections
4. **Backup your data** before migration
5. **Test thoroughly** before going live

## Need Help?
If you encounter issues during migration, I can help you troubleshoot specific problems!
