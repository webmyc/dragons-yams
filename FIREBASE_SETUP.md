# 🔥 Firebase Setup Guide for Yams Scorekeeper

This guide will help you set up Firebase Firestore for server-side history storage. It's completely free for small apps and very easy to set up!

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "yams-scorekeeper" (or any name you like)
4. Choose "No" for Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore Database
1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Choose a location close to you (e.g., "us-central1")
5. Click "Done"

### Step 3: Get Your Configuration
1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Name your app "Yams Scorekeeper"
6. Click "Register app"
7. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

### Step 4: Update Your App
1. Open `index.html` in your project
2. Find the `firebaseConfig` object (around line 90)
3. Replace it with your actual configuration from Step 3
4. Save the file

### Step 5: Deploy Your App
1. Push your changes to GitHub
2. Your app will automatically update at https://webmyc.github.io/dragons-yams/

## ✅ That's It!

Your app now has server-side history storage! Every game will be saved to Firebase and synchronized across all devices.

## 🔒 Security (Optional)

If you want to secure your database later:
1. Go to Firestore Database → Rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{document} {
      allow read, write: if true; // Anyone can read/write (for now)
    }
  }
}
```

## 💰 Cost

- **Free Tier**: 50,000 reads/day, 20,000 writes/day, 1GB storage
- **Perfect for**: Small groups, family games, casual use
- **Upgrade**: Only if you exceed free limits (very unlikely for personal use)

## 🎯 Benefits

- ✅ **Cross-device sync**: History available on any phone
- ✅ **No data loss**: Games saved even if you lose your phone
- ✅ **Real-time updates**: See games from other devices instantly
- ✅ **Offline support**: Works even without internet
- ✅ **Free forever**: No cost for personal use

## 🆘 Troubleshooting

**"Firebase not initialized" error:**
- Check that your config is correct
- Make sure you copied all the values from Firebase console

**"Permission denied" error:**
- Make sure Firestore is in "test mode"
- Check the security rules

**History not loading:**
- Check browser console for errors
- Try refreshing the page
- Check your internet connection

## 📱 Testing

1. Play a game on your phone
2. Check the history - it should appear
3. Open the app on another device
4. Check history - the same game should appear there too!

---

**Need help?** The Firebase setup is very straightforward, but if you get stuck, the Firebase documentation is excellent: https://firebase.google.com/docs
