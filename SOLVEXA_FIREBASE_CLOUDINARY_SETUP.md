# Solvexa — Firebase + Cloudinary Setup Guide

## Architecture Overview

| Service | Provider | Purpose |
|---|---|---|
| Authentication | Firebase Auth | Google Sign-In, email/password |
| Database | Firebase Firestore | User profiles, posts, signals, messages |
| Media Storage | **Cloudinary** | Images, avatars, cover photos, videos |
| Hosting | Firebase Hosting (optional) | Production deployment |

> **Why Cloudinary instead of Firebase Storage?**  
> This project uses the **Firebase Spark (free) plan**. Firebase Storage requires the Blaze (pay-as-you-go) plan. Cloudinary's free tier provides 25 GB storage + 25 GB bandwidth/month, which is more than sufficient.

---

## Step 1 — Firebase Setup (Already Done)

The Firebase project `solvexa-9e0e5` is already configured. Firestore security rules are deployed.

**Active Rules (deployed via `firebase deploy --only firestore:rules`):**
- `users/{userId}` — Read: any authenticated user. Write: owner only.
- `usernames/{username}` — Read: public. Write: authenticated, owner only.
- `posts/{postId}`, `signals/{signalId}`, `moments/{momentId}` — Full CRUD for authors.
- `conversations`, `messages`, `notifications` — Standard access control.

---

## Step 2 — Cloudinary Setup (Required for Media Uploads)

### 2.1 Create a Free Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **Sign Up for Free** — no credit card required
3. Note your **Cloud Name** from the Dashboard (e.g., `dxyz1234`)

### 2.2 Create an Unsigned Upload Preset

1. In Cloudinary Dashboard → **Settings** → **Upload**
2. Scroll to **Upload Presets** → click **Add upload preset**
3. Set:
   - **Preset name**: `solvexa_uploads`  
   - **Signing Mode**: **Unsigned** ← CRITICAL
   - **Folder**: `solvexa` (optional)
   - **Allowed formats**: jpg, jpeg, png, webp, gif, mp4, webm, mov
4. Click **Save**

> ⚠️ **Security**: Never use a **Signed** preset in frontend code. The Cloudinary API Secret must NEVER be exposed. Unsigned presets are safe for browser uploads.

### 2.3 Add Environment Variables

Edit `c:\PROJECTS\Solvexa project\solvexa-app\.env.local`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=solvexa_uploads
```

Replace `your_actual_cloud_name` with the cloud name from your Cloudinary dashboard.

### 2.4 Restart the Dev Server

```bash
npm run dev
```

---

## Step 3 — How Media Uploads Work

```
User selects file
      │
      ▼
validateMediaFile()  ← size + MIME type check
      │
      ▼
uploadToCloudinary() ← XHR POST to api.cloudinary.com
      │             ← progress callback (0-100%)
      ▼
CloudinaryUploadResult { secure_url, public_id, ... }
      │
      ▼
updateUserProfile()  ← save secure_url to Firestore users/{uid}.photoURL
```

**Files involved:**
- [`src/services/media/cloudinaryService.ts`](file:///c:/PROJECTS/Solvexa%20project/solvexa-app/src/services/media/cloudinaryService.ts) — Core upload service
- [`src/services/storage/mediaUpload.ts`](file:///c:/PROJECTS/Solvexa%20project/solvexa-app/src/services/storage/mediaUpload.ts) — Public API (used by all components)

---

## Step 4 — Verify Everything Works

### 4.1 Test Authentication
1. Open `http://localhost:5173`
2. Click **Sign in with Google**
3. Complete Google OAuth
4. You should see YOUR name (not "Alex Chen") in the profile

### 4.2 Test Firestore Read/Write
After login, the browser console should show:
```
[Firebase Auth] {
  projectId: 'solvexa-9e0e5',
  authenticated: true,
  uid: 'your-uid-here',
  ...
}
```
And NO `FirebaseError: Missing or insufficient permissions`.

### 4.3 Test Avatar Upload
1. Go to Profile → Edit Profile
2. Click avatar → select an image
3. Browser Network tab should show a request to `api.cloudinary.com` (not `firebasestorage.googleapis.com`)
4. After save, your Firestore document at `users/{uid}` should have `photoURL: "https://res.cloudinary.com/..."`

---

## Troubleshooting

### "Cloudinary is not configured" warning in console
→ Add `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` to `.env.local`  
→ Restart the dev server (`npm run dev`)

### "FirebaseError: Missing or insufficient permissions"
→ Run: `firebase deploy --only firestore:rules --project solvexa-9e0e5`  
→ This deploys the security rules to Google Cloud

### "Upload error: Upload preset not found"
→ Check the preset name matches exactly in Cloudinary Dashboard → Settings → Upload → Upload Presets  
→ Ensure **Signing Mode** is set to **Unsigned**

### Video uploads fail / very slow
→ Cloudinary free plan supports up to 100 MB videos  
→ Check `VITE_CLOUDINARY_UPLOAD_PRESET` is configured for video resource type  
→ In Cloudinary Dashboard, edit the preset and ensure `video` is in allowed resource types

---

## Firestore Security Rules Reference

Located at: [`c:\PROJECTS\Solvexa project\firestore.rules`](file:///c:/PROJECTS/Solvexa%20project/firestore.rules)

Deploy command:
```bash
firebase deploy --only firestore:rules --project solvexa-9e0e5
```

---

## Environment Variables Summary

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase App ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary Cloud Name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ✅ | Cloudinary Unsigned Upload Preset name |
| `VITE_FIREBASE_STORAGE_BUCKET` | ❌ Removed | NOT used — Spark plan has no Storage |
| `VITE_USE_EMULATOR` | Optional | Set to `true` to use local Firebase Emulators |
