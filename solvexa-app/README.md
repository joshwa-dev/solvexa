# Solvexa

**Solvexa** is a modern, high-fidelity spatial social network designed for pioneers, researchers, creators, and technical thinkers. Built on a futuristic dark signal aesthetic, Solvexa connects thought leaders through live broadcasts, video signals, 24h vertical moments, spaces, interactive mesh topologies, and direct Nexus messaging.

---

## ✨ Features

- **Authentication**: Secure Firebase Authentication supporting Email/Password with real reauthentication password updates and Google Single Sign-On (SSO).
- **Pulse Feed**: Chronological and high-resonance broadcast feeds with rich topic tagging, bookmarks, and interactive discussion threads.
- **Broadcast & Post Management**: Full CRUD capabilities allowing authors to compose, edit, and delete their own broadcasts with Firestore security rules enforcement.
- **Video Signals**: Short-form vertical technical demonstration signals with interactive resonance controls, edit/delete actions, and topic filtering.
- **24h Moments & Vertical Story Viewer**: Instagram/WhatsApp-style vertical 9:16 story viewer with auto-advancing progress indicators, pause-on-hold, mobile touch swipe gestures, and unique view tracking.
- **Signal Map**: Interactive spatial mesh topology canvas visualising active signals, node connections, resonance metrics, and deep-link details panels.
- **Spaces & Orbit**: Topic-based collaborative hubs and personal orbit topology frequency graphs.
- **Nexus Messaging**: Real-time direct messaging with WhatsApp-style message deletion (*Delete for me* and *Delete for everyone*).
- **Activity & Telemetry Analytics**: Authentic personal analytics dashboard computing active minutes, peak broadcast windows, and interaction histograms from real application events.
- **Media Architecture**: Powered by Cloudinary for unsigned image and video uploads, preserving the Firebase Spark (free) plan with zero Firebase Storage dependencies.
- **Demo Mode Isolation**: Seamless guest exploration mode completely separated from real authenticated user data.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom spatial glowing tokens and responsive glassmorphism
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Backend & Database**: [Firebase Authentication](https://firebase.google.com/products/auth), [Cloud Firestore](https://firebase.google.com/products/firestore)
- **Media Delivery**: [Cloudinary Free Tier](https://cloudinary.com/) (unsigned upload presets)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Copy the example configuration file:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and populate with your Firebase project credentials and Cloudinary upload preset.

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🏗️ Production Build

To compile and validate TypeScript and generate the production bundle:

```bash
npm run build
```

The compiled assets will be output to `dist/`.

---

## 🔒 Environment Configuration

Solvexa requires the following environment variables (see `.env.example`):

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID (e.g. `solvexa-9e0e5`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Account Cloud Name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Unsigned Upload Preset |

> **IMPORTANT**: Never commit `.env.local` or any private API secrets to version control.

---

## 📄 License

Private proprietary project. All rights reserved.
