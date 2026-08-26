# FIREBASE_SETUP.md — Solvexa Firebase Configuration Guide

## Overview

This guide covers creating and configuring the Firebase project for Solvexa.

---

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Project name: `solvexa` (or `solvexa-prod`)
4. Enable Google Analytics (optional but recommended)
5. Click **Create project**

---

## 2. Register Web App

1. In the Firebase project dashboard, click the **Web** icon (`</>`)
2. App nickname: `Solvexa Web`
3. Check **Also set up Firebase Hosting** (optional)
4. Click **Register app**
5. Copy the firebaseConfig object — you will use this in `.env`

---

## 3. Enable Authentication

1. In Firebase Console ? **Authentication** ? **Get started**
2. Click **Sign-in method** tab

### Enable Google Provider
1. Click **Google**
2. Toggle **Enable**
3. Set Project support email
4. Click **Save**

### Enable Email/Password
1. Click **Email/Password**
2. Toggle **Enable** (first toggle)
3. Optionally enable **Email link (passwordless sign-in)**
4. Click **Save**

### Configure Authorized Domains
1. In Authentication ? **Settings** ? **Authorized domains**
2. `localhost` is already added by default
3. Add your production domain when deploying

---

## 4. Create Firestore Database

1. Firebase Console ? **Firestore Database** ? **Create database**
2. Choose **Start in production mode** (we will deploy rules)
3. Select region closest to your users (e.g., `us-central1`)
4. Click **Done**

---

## 5. Create Cloud Storage

1. Firebase Console ? **Storage** ? **Get started**
2. Choose **Start in production mode**
3. Select the same region as Firestore
4. Click **Done**

---

## 6. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in values from your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Development only
VITE_USE_EMULATOR=true
```

**NEVER commit `.env.local` to Git.**

---

## 7. Deploy Security Rules

### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Storage Rules
```bash
firebase deploy --only storage:rules
```

### Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

---

## 8. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select features:
- [x] Firestore
- [x] Functions
- [x] Hosting
- [x] Storage
- [x] Emulators

---

## 9. Firebase Emulator Suite

### Start Emulators

```bash
firebase emulators:start
```

Default ports:
| Emulator | Port |
|----------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |
| Emulator UI | 4000 |

### Emulator UI
Open `http://localhost:4000` to view all emulator data.

### Connect App to Emulators (Dev Only)

In `src/services/firebase/emulator.ts`:
```typescript
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { auth, db, storage } from './config';

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

---

## 10. Firebase Configuration File (firebase.json)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "functions": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

---

## 11. Google OAuth Redirect URI (Production)

When deploying, add your domain to Firebase Authentication authorized domains:
1. Firebase Console ? Authentication ? Settings ? Authorized domains
2. Add: `yourdomain.com`
3. Add: `www.yourdomain.com`

For Firebase Hosting, `your-project-id.web.app` and `your-project-id.firebaseapp.com` are automatically authorized.

---

## 12. Production Checklist

Before going live:
- [ ] Security rules deployed (NOT in test mode)
- [ ] Firestore indexes deployed
- [ ] Storage rules deployed
- [ ] Authorized domains configured
- [ ] Google OAuth production domain added
- [ ] Environment variables set in hosting environment
- [ ] Firebase App Check enabled (optional but recommended)
- [ ] API key restrictions set in Google Cloud Console
- [ ] No emulator connection code active in production

---

## 13. Useful Firebase CLI Commands

```bash
# View current rules
firebase firestore:get-rules
firebase storage:get-rules

# Deploy everything
firebase deploy

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules

# Deploy functions only
firebase deploy --only functions

# Run emulators with seed data
firebase emulators:start --import=./seed-data

# Export emulator data
firebase emulators:export ./seed-data
```

---

*Solvexa FIREBASE_SETUP.md — v1.0*
