# Deploy to Render - Step by Step Guide

## Prerequisites
1. A [Render account](https://render.com)
2. A [GitHub repository](https://github.com) with your code pushed

## Step 1: Prepare Your Database
Render provides managed MongoDB databases. Create one:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "MongoDB"
3. Select a plan (Free tier available)
4. Copy the connection string

## Step 2: Deploy the API Service
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `estate-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your MongoDB connection string
   - `JWT_SECRET_KEY`: A strong random string
   - `CLIENT_ORIGIN`: `https://estate-client.onrender.com`
   - `RAZORPAY_KEY_ID`: Your Razorpay key
   - `RAZORPAY_KEY_SECRET`: Your Razorpay secret
5. Click "Create Web Service"

## Step 3: Deploy the Socket Service
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `estate-socket`
   - **Environment**: `Node`
   - **Build Command**: `cd socket && npm install`
   - **Start Command**: `cd socket && npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
5. Click "Create Web Service"

## Step 4: Deploy the Client (Frontend)
1. Go to Render Dashboard → "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `estate-client`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish directory**: `client/dist`
4. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://estate-api.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://estate-socket.onrender.com`
   - `VITE_RAZORPAY_KEY_ID`: Your Razorpay key
   - `VITE_CLOUDINARY_CLOUD_NAME`: `dci28nvyx`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`: `estate`
5. Click "Create Static Site"

## Step 5: Update API CORS
After deploying, update the API's `CLIENT_ORIGIN` environment variable to match your actual client URL.

## Important Notes
- The free tier services will sleep after 15 minutes of inactivity
- First request after sleep may take longer
- Ensure your MongoDB is accessible from Render's IPs

## Troubleshooting
- Check logs in Render Dashboard for errors
- Ensure all environment variables are set correctly
- Verify CORS settings allow your client origin