# Solvexa — Complete Firebase Setup Guide
*A Beginner-Friendly, Step-by-Step Guide for Vite + React*

---

## 1. What is Firebase?

**Firebase** is a comprehensive Backend-as-a-Service (BaaS) platform provided by Google. It provides client-side applications with scalable cloud infrastructure without requiring a custom backend server.

### Why Solvexa Uses Firebase
Solvexa uses Firebase to power its decentralized, real-time social mesh architecture:
* **Firebase Authentication**: Manages secure user sign-ups, password management, and one-click Google Sign-In.
* **Cloud Firestore**: A NoSQL real-time document database that stores user profiles (`users/{uid}`), community posts, signals, spaces, comments, and conversation metadata.
* **Firebase Storage**: Cloud object storage that securely stores binary media such as profile avatars, story moments, image attachments, and short signal videos.
* **Firebase Hosting (Optional)**: Fast global CDN hosting for deploying the production Vite/React frontend.

---

## 2. Create a Firebase Account & Project

1. Open your web browser and navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Sign in with your standard Google Account.
3. Click the **+ Add project** card (or **Create a project**).
4. Enter your project name: **`Solvexa`** (or a unique name like `solvexa-app-prod`).
5. Choose whether to enable **Google Analytics** (recommended for production telemetry, optional for local testing).
6. Click **Create project** and wait a few seconds for Google Cloud to provision your resources.
7. Click **Continue** to open the project overview dashboard.

---

## 3. Register the Solvexa Web Application

1. In the Firebase Project Overview dashboard, click the **Web** icon (`</>`) located under *"Get started by adding Firebase to your app"*.
2. Enter an App nickname: **`Solvexa Web`**.
3. Leave *"Also set up Firebase Hosting"* unchecked for now (you can add it later when deploying).
4. Click **Register app**.
5. Firebase will display an initialization code snippet containing your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "solvexa-app.firebaseapp.com",
     projectId: "solvexa-app",
     storageBucket: "solvexa-app.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```
6. **Keep this tab open** or copy these individual values.

> [!NOTE]
> Firebase Web credentials (`apiKey`, `appId`, etc.) are public identifiers used by your browser client to talk to your project. However, using `.env.local` keeps your configuration organized, modular, and prevents hardcoding credentials in source files.

---

## 4. Create `.env.local`

In the root of your Solvexa application directory, create a new file named `.env.local`.

### Exact Windows Path:
```text
C:\PROJECTS\Solvexa project\solvexa-app\.env.local
```

> [!TIP]
> **Windows Hidden File Extensions**: If Windows hides known file extensions, make sure the file is named `.env.local` and not `.env.local.txt`. In Windows File Explorer, click *View → Show → File name extensions*.

### Exact Template for `.env.local`:
```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

* **Important Formatting Rules**:
  * Do NOT add quotation marks (`"` or `'`) around values.
  * Do NOT add spaces around the `=` sign.
  * Do NOT add commas at the end of lines.
  * Each variable must start with `VITE_` to be accessible in Vite/React.

---

## 5. Environment Variables Reference Table

| Variable | Meaning & Purpose | Where to Find in Firebase Console |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Public browser API key for Firebase services | Project Settings (`⚙`) → General → Your apps → SDK setup |
| `VITE_FIREBASE_AUTH_DOMAIN` | Authentication handler domain (`<project-id>.firebaseapp.com`) | Project Settings → General → Web app config |
| `VITE_FIREBASE_PROJECT_ID` | Unique Google Cloud project identifier | Project Settings → General → Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket URL (`<project-id>.appspot.com` or `firebasestorage.app`) | Storage section → Bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging numeric sender identifier | Project Settings → Cloud Messaging → Sender ID |
| `VITE_FIREBASE_APP_ID` | Unique Web App registration ID | Project Settings → General → App ID |

---

## 6. Git Safety (`.gitignore`)

Ensure your environment configuration files are never committed to version control:

1. Open `solvexa-app/.gitignore`.
2. Verify the following entries exist:
   ```text
   .env
   .env.local
   .env.*.local
   ```

> [!WARNING]
> **Security Reminder**: While Firebase client configuration is browser-safe, never put private service-account credentials, server-side secret keys, or Admin SDK JSON tokens into frontend `.env` files.

---

## 7. Enable Firebase Authentication

1. In the Firebase Console left menu, navigate to **Build → Authentication**.
2. Click **Get started**.
3. Navigate to the **Sign-in method** tab.

### A. Enable Google Sign-In
1. Click **Google** in the provider list.
2. Toggle the switch to **Enable**.
3. Select your **Project support email** from the dropdown.
4. Click **Save**.

### B. Enable Email/Password Sign-In
1. Click **Email/Password** in the provider list.
2. Toggle **Email/Password** to **Enable** (leave Email link passwordless sign-in disabled).
3. Click **Save**.

---

## 8. Configure Authorized Domains

For Google Sign-In popups to succeed, the domain hosting your frontend must be authorized:

1. In **Authentication → Settings → Authorized domains**.
2. Verify that **`localhost`** is present in the list (added by default).
3. When deploying to production (e.g., Vercel, Firebase Hosting), click **Add domain** and enter your production domain (e.g., `solvexa.app`).

---

## 9. Conceptual Firebase Initialization in Vite

Solvexa automatically loads environment variables using Vite's `import.meta.env`:

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
```

---

## 10. Verify Firebase SDK Installation

To check if the Firebase SDK is already installed in your project:

```bash
cd "C:\PROJECTS\Solvexa project\solvexa-app"
npm list firebase
```

If it is not installed, install it:
```bash
npm install firebase
```
*(Do not run `npm install` again if it is already listed in `package.json`.)*

---

## 11. Google Authentication Test Flow

1. Open your terminal in `C:\PROJECTS\Solvexa project\solvexa-app`.
2. Start the local server: `npm run dev`.
3. Open `http://localhost:5173` in your browser.
4. Click **Sign In** → **Continue with Google**.
5. Select your Google Account in the Google popup window.
6. **Expected Result**: The popup closes, Solvexa creates/loads your user profile in Firestore (`users/{uid}`), and redirects directly to the **Pulse** home stream displaying your real account name and avatar.

---

## 12. Troubleshooting: Environment Variables Not Loading

* **Vite Caching**: Vite loads `.env.local` on startup. If you modify `.env.local` while `npm run dev` is running, changes will not take effect until you restart the server.
* **Fix**:
  1. Press `Ctrl + C` in the terminal running Vite.
  2. Run `npm run dev` again.

---

## 13. Troubleshooting: `auth/api-key-not-valid`

If you see `auth/api-key-not-valid` in the browser console:
1. Verify that `VITE_FIREBASE_API_KEY` in `.env.local` matches the API key in your Firebase Console exactly.
2. Check for accidental spaces before or after the key.
3. Ensure the variable name is spelled exactly: `VITE_FIREBASE_API_KEY`.
4. Restart your Vite development server.

---

## 14. Troubleshooting: `CONFIGURATION_NOT_FOUND`

If Google Sign-In returns `CONFIGURATION_NOT_FOUND`:
1. Check that **Google Sign-In** is enabled under *Firebase Console → Authentication → Sign-in method*.
2. Verify that **Project support email** is saved under the Google provider settings.
3. Verify that `authDomain` in `.env.local` matches `<your-project-id>.firebaseapp.com`.
4. Ensure `localhost` is listed in *Authorized domains*.

---

## 15. Create Cloud Firestore Database

1. In the Firebase Console left menu, navigate to **Build → Firestore Database**.
2. Click **Create database**.
3. Select a database location closest to your users (e.g., `nam5 (us-central)` or `europe-west1`).
4. Choose **Start in test mode** for initial local development, or **Production mode**.
5. Click **Create**.

> [!WARNING]
> Never use `allow read, write: if true;` as a permanent production rule. Use authenticated rules:
> ```javascript
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /users/{userId} {
>       allow read: if true;
>       allow write: if request.auth != null && request.auth.uid == userId;
>     }
>     match /{document=**} {
>       allow read, write: if request.auth != null;
>     }
>   }
> }
> ```

---

## 16. Enable Firebase Storage for Media Uploads

1. In the Firebase Console left menu, navigate to **Build → Storage**.
2. Click **Get started**.
3. Choose your storage security rules template and click **Next**.
4. Select your Cloud Storage location (matching Firestore) and click **Done**.

---

## 17. Security Rules Overview

Solvexa enforces client safety through:
1. **Firebase Authentication**: Validates user identity token (`request.auth.uid`).
2. **Firestore Security Rules**: Ensures users can only write to their own profile document (`users/{uid}`).
3. **Storage Security Rules**: Ensures users can only upload media to their designated storage folders (`profilePictures/{uid}/*`, `signals/{uid}/*`).

---

## 18. `.env.local` Verification Checklist

- [ ] `.env.local` exists in `C:\PROJECTS\Solvexa project\solvexa-app\`
- [ ] Every variable starts with `VITE_`
- [ ] No quotation marks around values
- [ ] `VITE_FIREBASE_API_KEY` is populated
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` is populated
- [ ] `VITE_FIREBASE_PROJECT_ID` is populated
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` is populated
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` is populated
- [ ] `VITE_FIREBASE_APP_ID` is populated
- [ ] `.env.local` is listed in `.gitignore`
- [ ] Vite dev server restarted after saving `.env.local`

---

## 19. Complete Verification Checklist

### Firebase Infrastructure
- [ ] Firebase project created in console
- [ ] Web App registered and config copied
- [ ] `.env.local` configured in project root
- [ ] Firebase SDK installed (`firebase` in `package.json`)

### Authentication
- [ ] Google provider enabled in console
- [ ] Email/password provider enabled in console
- [ ] `localhost` authorized in domains list
- [ ] Google Sign-In completes and redirects to Pulse
- [ ] Email/Password sign-up and sign-in verified
- [ ] Sign out clears state and redirects to Login

### Database & Storage
- [ ] Firestore Database created
- [ ] Firestore security rules configured
- [ ] Cloud Storage bucket created
- [ ] Profile photo upload verified

---

## 20. Troubleshooting Reference Table

| Issue / Error | Probable Root Cause | Solution |
|---|---|---|
| `auth/api-key-not-valid` | Typo or missing API key in `.env.local` | Copy `apiKey` from Firebase Console and restart Vite |
| `CONFIGURATION_NOT_FOUND` | Google Auth provider disabled in console | Enable Google under Authentication → Sign-in method |
| `auth/popup-blocked` | Browser blocked authentication popup | Click "Always allow popups from localhost" |
| `auth/popup-closed-by-user` | User closed popup before completing login | Click Continue with Google and finish account selection |
| `auth/unauthorized-domain` | Domain not authorized | Add `localhost` under Authentication → Settings → Authorized domains |
| `.env.local` variables undefined | Server was not restarted or missing `VITE_` prefix | Add `VITE_` prefix and restart `npm run dev` |
| `storage/unauthorized` | Storage security rules blocking upload | Update Storage rules to allow authenticated writes |
| `permission-denied` | Firestore rules blocking write | Ensure user is signed in with valid `request.auth.uid` |

---

## 21. Important Security Notes

* **Never commit** `.env.local` or service account keys to GitHub.
* **Client credentials** (`apiKey`, `appId`) are safe to expose in client code because Firebase security is enforced on Google's servers via **Firestore Security Rules** and **Storage Rules**.
* **Admin SDK credentials** (Service Account JSON keys) must **NEVER** be included in frontend code.

---

## 22. Complete Setup Flow Diagram

```text
Create Firebase Project in Console
              ↓
      Register Web App
              ↓
  Copy firebaseConfig Values
              ↓
Create solvexa-app/.env.local
              ↓
   Add VITE_FIREBASE_* Keys
              ↓
  Enable Google Authentication
              ↓
 Enable Email/Password Auth
              ↓
 Verify Authorized Domains (localhost)
              ↓
   Create Firestore Database
              ↓
     Enable Cloud Storage
              ↓
   Restart Vite Dev Server
              ↓
 Launch & Test Solvexa Login!
```

---

## 23. Solvexa Project Paths

* **Project Root Directory**: `C:\PROJECTS\Solvexa project\solvexa-app\`
* **Environment File**: `C:\PROJECTS\Solvexa project\solvexa-app\.env.local`
* **Git Ignore File**: `C:\PROJECTS\Solvexa project\solvexa-app\.gitignore`
* **Firebase Config Module**: `C:\PROJECTS\Solvexa project\solvexa-app\src\lib\firebase.ts`

---

## 24. Pre-Flight Checklist Before Debugging

Before reporting Firebase connection issues, complete these 15 steps:
1. Verify internet connection is active.
2. Confirm Firebase project exists in [Firebase Console](https://console.firebase.google.com/).
3. Confirm Web App is registered under Project Settings.
4. Confirm `.env.local` is located in `solvexa-app/` root.
5. Confirm all 6 `VITE_FIREBASE_*` variables are present without quotes.
6. Confirm `npm list firebase` shows `firebase@...` installed.
7. Confirm Google Sign-In is enabled in Authentication settings.
8. Confirm Project Support Email is selected in Google Sign-In settings.
9. Confirm `localhost` is listed in Authorized Domains.
10. Confirm Cloud Firestore database is created.
11. Confirm Firebase Storage is enabled.
12. Stop any running Vite dev server (`Ctrl + C`).
13. Start Vite dev server fresh: `npm run dev`.
14. Open an incognito browser window at `http://localhost:5173`.
15. Click "Continue with Google" and inspect the browser console.
