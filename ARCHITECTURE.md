# ARCHITECTURE.md — Solvexa Application Architecture

## Overview

Solvexa is a production-quality social networking web application built on Firebase and React. It follows a feature-first modular architecture with strict separation of concerns between UI components, feature logic, data services, and infrastructure.

---

## Technology Stack

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite |
| Styling | Tailwind CSS (with custom Solvexa design tokens) |
| Routing | React Router v6 |
| Icons | Material Symbols Outlined (Google Fonts) |
| Typography | Inter (Google Fonts) |

### Backend / Cloud (Firebase)
| Service | Purpose |
|---------|---------|
| Firebase Authentication | User identity (Google + Email/Password) |
| Cloud Firestore | Primary database (NoSQL, real-time) |
| Cloud Storage for Firebase | Media (photos, videos, moments) |
| Firebase Security Rules | Authorization enforcement |
| Firebase Emulator Suite | Local development environment |
| Cloud Functions | Server-side trusted logic (counters, notifications) |

---

## Project Structure

```
solvexa/
+-- src/
¦   +-- app/
¦   ¦   +-- App.tsx                 # Root app with router + providers
¦   ¦   +-- providers.tsx           # Auth, Theme, Error boundary providers
¦   ¦   +-- router.tsx              # Route definitions + guards
¦   ¦
¦   +-- components/
¦   ¦   +-- common/                 # Reusable primitive components
¦   ¦   ¦   +-- Button.tsx
¦   ¦   ¦   +-- Avatar.tsx
¦   ¦   ¦   +-- Card.tsx
¦   ¦   ¦   +-- Input.tsx
¦   ¦   ¦   +-- Modal.tsx
¦   ¦   ¦   +-- LoadingSpinner.tsx
¦   ¦   ¦   +-- EmptyState.tsx
¦   ¦   ¦   +-- ErrorState.tsx
¦   ¦   ¦   +-- SignalChip.tsx
¦   ¦   +-- navigation/             # Nav components
¦   ¦   ¦   +-- SideNav.tsx
¦   ¦   ¦   +-- TopBar.tsx
¦   ¦   ¦   +-- MobileBottomNav.tsx
¦   ¦   +-- posts/                  # Post-related UI components
¦   ¦   +-- moments/                # Moment UI components
¦   ¦   +-- signals/                # Signals video UI components
¦   ¦   +-- messages/               # Chat UI components
¦   ¦   +-- profiles/               # Profile UI components
¦   ¦   +-- spaces/                 # Space UI components
¦   ¦   +-- notifications/          # Notification UI components
¦   ¦   +-- search/                 # Search UI components
¦   ¦
¦   +-- features/                   # Feature-level logic
¦   ¦   +-- auth/
¦   ¦   ¦   +-- AuthContext.tsx
¦   ¦   ¦   +-- useAuth.ts
¦   ¦   ¦   +-- LoginPage.tsx
¦   ¦   ¦   +-- SignupPage.tsx
¦   ¦   ¦   +-- OnboardingPage.tsx
¦   ¦   +-- feed/
¦   ¦   ¦   +-- PulsePage.tsx
¦   ¦   ¦   +-- useFeed.ts
¦   ¦   ¦   +-- FeedPost.tsx
¦   ¦   +-- posts/
¦   ¦   +-- moments/
¦   ¦   +-- signals/
¦   ¦   +-- messages/
¦   ¦   +-- profiles/
¦   ¦   +-- spaces/
¦   ¦   +-- notifications/
¦   ¦   +-- search/
¦   ¦
¦   +-- hooks/                      # Shared custom hooks
¦   ¦   +-- useFirestoreQuery.ts
¦   ¦   +-- usePagination.ts
¦   ¦   +-- useRealtime.ts
¦   ¦   +-- useUpload.ts
¦   ¦
¦   +-- services/
¦   ¦   +-- firebase/
¦   ¦   ¦   +-- config.ts           # Firebase app init (reads env vars)
¦   ¦   ¦   +-- emulator.ts         # Emulator connection (dev only)
¦   ¦   +-- auth/
¦   ¦   ¦   +-- authService.ts      # Google, email auth operations
¦   ¦   ¦   +-- profileService.ts   # User profile creation/update
¦   ¦   +-- firestore/
¦   ¦   ¦   +-- postsService.ts
¦   ¦   ¦   +-- commentsService.ts
¦   ¦   ¦   +-- signalsService.ts
¦   ¦   ¦   +-- followService.ts
¦   ¦   ¦   +-- momentsService.ts
¦   ¦   ¦   +-- spacesService.ts
¦   ¦   ¦   +-- messagesService.ts
¦   ¦   ¦   +-- notificationsService.ts
¦   ¦   ¦   +-- searchService.ts
¦   ¦   ¦   +-- usernamesService.ts
¦   ¦   +-- storage/
¦   ¦       +-- storageService.ts
¦   ¦
¦   +-- lib/
¦   ¦   +-- errors.ts               # Error mapping (Firebase ? user-friendly)
¦   ¦   +-- validators.ts           # Input validation
¦   ¦   +-- constants.ts            # App-wide constants
¦   ¦
¦   +-- routes/
¦   ¦   +-- ProtectedRoute.tsx      # Auth guard
¦   ¦   +-- PublicRoute.tsx         # Redirect if authenticated
¦   ¦   +-- index.tsx               # Route map
¦   ¦
¦   +-- types/
¦   ¦   +-- user.types.ts
¦   ¦   +-- post.types.ts
¦   ¦   +-- moment.types.ts
¦   ¦   +-- signal.types.ts
¦   ¦   +-- space.types.ts
¦   ¦   +-- message.types.ts
¦   ¦   +-- notification.types.ts
¦   ¦
¦   +-- utils/
¦   ¦   +-- formatters.ts           # Date, number formatters
¦   ¦   +-- mediaHelpers.ts
¦   ¦   +-- urlHelpers.ts
¦   ¦
¦   +-- styles/
¦   ¦   +-- globals.css             # Base Solvexa CSS (from DESIGN.md)
¦   ¦   +-- tailwind.css            # Tailwind directives
¦   ¦
¦   +-- main.tsx                    # Entry point
¦
+-- functions/                      # Cloud Functions
¦   +-- src/
¦   ¦   +-- auth/
¦   ¦   ¦   +-- onUserCreated.ts    # Create Firestore profile on signup
¦   ¦   +-- posts/
¦   ¦   ¦   +-- onSignal.ts         # Signal count management
¦   ¦   +-- notifications/
¦   ¦       +-- triggers.ts         # Notification creation triggers
¦   +-- package.json
¦
+-- public/
+-- tests/
¦   +-- rules/                      # Firestore + Storage rules tests
¦   +-- auth/
¦   +-- components/
¦
+-- firestore.rules
+-- firestore.indexes.json
+-- storage.rules
+-- firebase.json
+-- .env.example
+-- DESIGN.md
+-- ARCHITECTURE.md
+-- SECURITY.md
+-- TESTING.md
+-- README.md
```

---

## Data Model (Firestore Collections)

### `users/{uid}`
```typescript
{
  uid: string;
  displayName: string;
  username: string;           // unique, lowercase
  email: string;              // not used as identifier
  photoURL: string | null;
  coverPhotoURL: string | null;
  bio: string;
  location: string;
  website: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  followerCount: number;      // managed by Cloud Functions
  followingCount: number;     // managed by Cloud Functions
  signalCount: number;        // managed by Cloud Functions
  spaceCount: number;
  isPrivate: boolean;
  onboardingComplete: boolean;
  privacySettings: {
    whoCanMessage: 'everyone' | 'following' | 'nobody';
    whoCanMention: 'everyone' | 'following';
    whoCanComment: 'everyone' | 'following' | 'nobody';
    activityVisible: boolean;
  };
  notificationPrefs: Record<string, boolean>;
}
```

### `usernames/{username}`
```typescript
{ uid: string; }  // For username uniqueness enforcement
```

### `posts/{postId}`
```typescript
{
  postId: string;
  authorId: string;           // Firebase Auth UID
  content: string;
  media: MediaItem[];
  mediaType: 'none' | 'image' | 'video' | 'multi';
  createdAt: Timestamp;       // serverTimestamp()
  updatedAt: Timestamp;
  visibility: 'public' | 'followers' | 'private';
  spaceId: string | null;
  topics: string[];
  commentCount: number;
  signalCount: number;
  shareCount: number;
  saveCount: number;
  location: string | null;
  pollOptions: PollOption[] | null;
  isDeleted: boolean;
}
```

### `posts/{postId}/comments/{commentId}`
```typescript
{
  commentId: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  replyTo: string | null;     // commentId of parent
  signalCount: number;
  isDeleted: boolean;
}
```

### `signals/{signalId}`  (post signals/reactions)
```typescript
{
  signalId: string;           // deterministic: `${userId}_${targetId}`
  userId: string;
  targetId: string;           // postId, commentId, etc.
  targetType: 'post' | 'comment' | 'signal_video' | 'moment';
  signalType: 'insightful' | 'interesting' | 'inspiring' | 'funny' | 'curious' | 'agree';
  createdAt: Timestamp;
}
```

### `follows/{followId}`
```typescript
{
  followId: string;           // `${followerId}_${followedId}`
  followerId: string;
  followedId: string;
  createdAt: Timestamp;
  status: 'active' | 'pending';  // pending for private accounts
}
```

### `moments/{momentId}`
```typescript
{
  momentId: string;
  authorId: string;
  media: string | null;       // Storage URL
  mediaType: 'photo' | 'video' | 'text' | 'poll' | 'question';
  text: string | null;
  backgroundColor: string | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;       // createdAt + 24 hours
  visibility: 'public' | 'followers';
  viewCount: number;
  signalCount: number;
}
```

### `momentViews/{viewId}`
```typescript
{
  viewId: string;             // `${momentId}_${viewerId}`
  momentId: string;
  viewerId: string;
  viewedAt: Timestamp;
}
```

### `spaces/{spaceId}`
```typescript
{
  spaceId: string;
  name: string;
  slug: string;               // URL-safe unique identifier
  description: string;
  coverImage: string | null;
  ownerId: string;
  memberCount: number;
  createdAt: Timestamp;
  visibility: 'public' | 'private';
  rules: SpaceRule[];
  topics: string[];
}
```

### `spaceMembers/{memberId}`
```typescript
{
  memberId: string;           // `${spaceId}_${userId}`
  spaceId: string;
  userId: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: Timestamp;
  isBanned: boolean;
}
```

### `conversations/{conversationId}`
```typescript
{
  conversationId: string;
  type: 'direct' | 'group';
  participants: string[];     // UIDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage: MessagePreview | null;
  unreadCounts: Record<string, number>;
  groupName: string | null;
  groupAvatar: string | null;
  createdBy: string | null;
}
```

### `conversations/{conversationId}/messages/{messageId}`
```typescript
{
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'shared_post' | 'shared_signal' | 'shared_moment';
  sharedContent: SharedContent | null;
  sentAt: Timestamp;
  editedAt: Timestamp | null;
  isDeleted: boolean;
  readBy: Record<string, Timestamp>;
  reactions: Record<string, string[]>;
}
```

### `notifications/{notificationId}`
```typescript
{
  notificationId: string;
  recipientId: string;
  senderId: string;
  type: 'signal' | 'comment' | 'reply' | 'follow' | 'follow_request' | 'mention' | 'message' | 'space' | 'moment_reply' | 'share' | 'system';
  targetId: string;           // postId, commentId, etc.
  targetType: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

### `savedItems/{savedId}`
```typescript
{
  savedId: string;            // `${userId}_${contentId}`
  userId: string;
  contentId: string;
  contentType: 'post' | 'signal_video' | 'moment';
  collectionId: string | null;
  savedAt: Timestamp;
}
```

### `collections/{collectionId}`
```typescript
{
  collectionId: string;
  ownerId: string;
  name: string;
  createdAt: Timestamp;
  itemCount: number;
}
```

### `blocks/{blockId}`
```typescript
{
  blockId: string;            // `${blockerId}_${blockedId}`
  blockerId: string;
  blockedId: string;
  createdAt: Timestamp;
}
```

### `mutes/{muteId}`
```typescript
{
  muteId: string;             // `${muterId}_${mutedId}`
  muterId: string;
  mutedId: string;
  muteType: 'user' | 'topic';
  createdAt: Timestamp;
}
```

### `reports/{reportId}`
```typescript
{
  reportId: string;
  reporterId: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'user' | 'signal_video' | 'moment' | 'space';
  category: 'spam' | 'harassment' | 'hate' | 'violence' | 'sexual' | 'misinformation' | 'impersonation' | 'other';
  description: string;
  createdAt: Timestamp;
  status: 'pending' | 'reviewed' | 'resolved';
}
```

---

## Authentication Flow

```
User visits app
  ?
Auth state listener (onAuthStateChanged)
  ?
  +-- Not authenticated ? redirect to /login (if protected route)
  +-- Authenticated
        ?
        Check Firestore users/{uid} exists?
          +-- No ? create profile doc ? redirect to /onboarding
          +-- Yes
                ?
                Check onboardingComplete?
                  +-- false ? redirect to /onboarding
                  +-- true ? proceed to requested route (default: /pulse)
```

---

## State Management

- **Auth state**: React Context (`AuthContext`) wrapping Firebase `onAuthStateChanged`
- **Feature state**: Local component state + custom hooks with Firestore subscriptions
- **Feed state**: Custom hook with Firestore paginated queries + cursor
- **Chat state**: Real-time Firestore listener per active conversation
- **No global state library** (Redux/Zustand) unless complexity demands it

---

## Real-time Strategy

| Feature | Strategy |
|---------|---------|
| Active chat | `onSnapshot` listener per conversation |
| Notifications | `onSnapshot` on user's notifications (unread only) |
| Online status | Firestore presence (set on focus, clear on blur) |
| Feed | Paginated one-time queries (not real-time) |
| Posts | One-time query + manual refresh |
| Signal counts | One-time query with optimistic UI |

**Rule**: Unsubscribe from ALL listeners on component unmount.

---

## Routing

```
/ ? Landing (public)
/login ? Login
/signup ? Signup
/onboarding ? Onboarding (protected)

/pulse ? Main Feed (protected)
/explore ? Explore
/moments ? Moments viewer
/signals ? Signals video feed
/spaces ? Space browser
/spaces/:spaceId ? Space detail

/post/:postId ? Post detail
/signal/:signalId ? Signal video detail

/profile/:username ? User profile (public if public account)
/settings ? Settings (protected)
/settings/* ? Sub-settings

/messages ? Messages list (protected)
/messages/:conversationId ? Chat view

/notifications ? Notifications (protected)
/saved ? Saved items (protected)
/saved/:collectionId ? Collection items

/create ? Create landing
/create/post ? Post composer
/create/moment ? Moment creator
/create/signal ? Signal video upload

/signal-map ? Signal Map visualization
/orbit ? My Orbit visualization

* ? 404 page (Solvexa branded)
```

---

## Error Handling

- **Error Boundaries**: App-level + per-feature-section boundaries
- **Firebase errors**: Mapped to user-friendly messages in `lib/errors.ts`
- **Network failures**: Detected and shown with retry option
- **Not found**: Branded 404 page
- **Permission errors**: Never expose raw Firebase security error — show appropriate empty/auth state

---

## Performance

| Technique | Applied To |
|-----------|-----------|
| Lazy loading | All routes (React.lazy) |
| Pagination (cursor) | Feed, comments, notifications |
| Virtualization | Long lists (react-virtual) |
| Image lazy loading | Feed images |
| Video lazy loading | Signals, Moments |
| Memoization | Expensive list renders |
| Firestore indexes | All composite queries |

---

## Media Storage Structure

```
users/{uid}/profile/avatar.jpg
users/{uid}/profile/cover.jpg
users/{uid}/posts/{postId}/{filename}
users/{uid}/moments/{momentId}/{filename}
users/{uid}/signals/{signalId}/{filename}
conversations/{conversationId}/{messageId}/{filename}
spaces/{spaceId}/cover.jpg
```

---

*Solvexa ARCHITECTURE.md — v1.0*
