# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Click "Try Free" and create an account
3. Choose the FREE tier (M0 Sandbox)

## Step 2: Create a Cluster
1. After login, click "Build a Database"
2. Choose "M0 FREE" tier
3. Select a cloud provider and region (choose closest to your users)
4. Name your cluster (e.g., "event-koi-cluster")
5. Click "Create"

## Step 3: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and strong password
5. Set database user privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses of your hosting service
5. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver
5. Copy the connection string (looks like: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority)

## Step 6: Update Your Application
Replace your local MongoDB connection string with the Atlas connection string in your .env file.

## Step 7: Migrate Your Data
Use MongoDB Compass or mongodump/mongorestore to transfer your local data to Atlas.
