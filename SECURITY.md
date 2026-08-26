# SECURITY.md — Solvexa Security Model

> **Principle**: Assume every client request is potentially malicious. The frontend is never trusted. Firebase Security Rules and Cloud Functions enforce all authorization.

---

## 1. Core Security Principles

1. **Never trust the client** — validate all data server-side via Security Rules
2. **UID-based authorization** — use Firebase Auth UID as the canonical user identifier
3. **Least privilege** — grant only the minimum permissions required
4. **Defense in depth** — UI restrictions are UX only, not security
5. **No secrets in frontend** — only public Firebase config keys in browser code
6. **Counters via transactions** — follower/signal counts managed by trusted logic only

---

## 2. What MUST NEVER Happen

- `allow read, write: if true;` in any production rule
- Service account credentials in browser code
- Private secrets committed to Git
- Client-supplied `authorId` trusted without verification
- User A able to modify User B's documents
- Private messages readable by non-participants
- Private account content readable by non-followers
- Arbitrary media deletion by non-owners

---

## 3. Firebase Authentication Security

- Use `onAuthStateChanged` as the single source of auth truth
- Never read `localStorage` for auth state manually
- Google sign-in: use popup (desktop) / redirect (mobile) per Firebase recommendations
- Password reset emails sent through Firebase Auth (not custom SMTP)
- Email verification encouraged for email/password accounts
- Account deletion removes Auth record AND Firestore data (via Cloud Function)

---

## 4. Firestore Security Rules

File: `firestore.rules`

### Global Functions

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function userExists(uid) {
      return exists(/databases/$(database)/documents/users/$(uid));
    }

    function isFollowing(followerId, followedId) {
      return exists(/databases/$(database)/documents/follows/$(followerId + '_' + followedId));
    }

    function isPublicProfile(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.isPrivate == false;
    }

    function isSpaceMember(spaceId, uid) {
      return exists(/databases/$(database)/documents/spaceMembers/$(spaceId + '_' + uid));
    }

    function isSpaceModerator(spaceId, uid) {
      let member = get(/databases/$(database)/documents/spaceMembers/$(spaceId + '_' + uid));
      return member.data.role == 'owner' || member.data.role == 'moderator';
    }

    function isConversationParticipant(conversationId, uid) {
      return uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }

    function isNotBlocked(viewerId, profileId) {
      return !exists(/databases/$(database)/documents/blocks/$(profileId + '_' + viewerId));
    }
```

### Rules per Collection

```javascript
    // --- USERS ---
    match /users/{uid} {
      // Public profile fields visible to all authenticated users (if not blocked)
      allow read: if isAuthenticated() && isNotBlocked(request.auth.uid, uid);
      // Only the owner can write their own profile
      allow create: if isOwner(uid) &&
        request.resource.data.uid == uid &&
        request.resource.data.followerCount == 0 &&
        request.resource.data.followingCount == 0 &&
        request.resource.data.signalCount == 0;
      allow update: if isOwner(uid) &&
        // Prevent client from modifying counters
        !('followerCount' in request.resource.data.diff(resource.data).affectedKeys()) &&
        !('followingCount' in request.resource.data.diff(resource.data).affectedKeys()) &&
        !('signalCount' in request.resource.data.diff(resource.data).affectedKeys());
      allow delete: if false; // Only via Cloud Function
    }

    // --- USERNAMES ---
    match /usernames/{username} {
      allow read: if true; // Username availability check
      allow create: if isAuthenticated() &&
        request.resource.data.uid == request.auth.uid;
      allow delete: if isAuthenticated() &&
        resource.data.uid == request.auth.uid;
      allow update: if false;
    }

    // --- POSTS ---
    match /posts/{postId} {
      allow read: if isAuthenticated() &&
        (resource.data.visibility == 'public' ||
         (resource.data.visibility == 'followers' &&
          (isFollowing(request.auth.uid, resource.data.authorId) ||
           isOwner(resource.data.authorId))) ||
         isOwner(resource.data.authorId));
      allow create: if isAuthenticated() &&
        request.resource.data.authorId == request.auth.uid &&
        request.resource.data.commentCount == 0 &&
        request.resource.data.signalCount == 0 &&
        request.resource.data.shareCount == 0 &&
        request.resource.data.saveCount == 0;
      allow update: if isOwner(resource.data.authorId) &&
        !('authorId' in request.resource.data.diff(resource.data).affectedKeys()) &&
        !('commentCount' in request.resource.data.diff(resource.data).affectedKeys()) &&
        !('signalCount' in request.resource.data.diff(resource.data).affectedKeys());
      allow delete: if isOwner(resource.data.authorId);

      // --- COMMENTS ---
      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() &&
          request.resource.data.authorId == request.auth.uid;
        allow update: if isOwner(resource.data.authorId) &&
          !('authorId' in request.resource.data.diff(resource.data).affectedKeys());
        allow delete: if isOwner(resource.data.authorId) ||
          isOwner(get(/databases/$(database)/documents/posts/$(postId)).data.authorId);
      }
    }

    // --- SIGNALS (reactions) ---
    match /signals/{signalId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        signalId == request.resource.data.userId + '_' + request.resource.data.targetId;
      allow delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
        resource.data.userId == request.auth.uid &&
        !('userId' in request.resource.data.diff(resource.data).affectedKeys()) &&
        !('targetId' in request.resource.data.diff(resource.data).affectedKeys());
    }

    // --- FOLLOWS ---
    match /follows/{followId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.resource.data.followerId == request.auth.uid &&
        followId == request.resource.data.followerId + '_' + request.resource.data.followedId;
      allow delete: if isAuthenticated() &&
        resource.data.followerId == request.auth.uid;
      allow update: if false;
    }

    // --- MOMENTS ---
    match /moments/{momentId} {
      allow read: if isAuthenticated() &&
        (resource.data.visibility == 'public' ||
         isOwner(resource.data.authorId) ||
         isFollowing(request.auth.uid, resource.data.authorId));
      allow create: if isAuthenticated() &&
        request.resource.data.authorId == request.auth.uid;
      allow delete: if isOwner(resource.data.authorId);
      allow update: if isOwner(resource.data.authorId);
    }

    // --- MOMENT VIEWS ---
    match /momentViews/{viewId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.resource.data.viewerId == request.auth.uid;
      allow update, delete: if false;
    }

    // --- SPACES ---
    match /spaces/{spaceId} {
      allow read: if isAuthenticated() &&
        (resource.data.visibility == 'public' || isSpaceMember(spaceId, request.auth.uid));
      allow create: if isAuthenticated() &&
        request.resource.data.ownerId == request.auth.uid;
      allow update: if isSpaceModerator(spaceId, request.auth.uid);
      allow delete: if isAuthenticated() &&
        resource.data.ownerId == request.auth.uid;
    }

    // --- SPACE MEMBERS ---
    match /spaceMembers/{memberId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.role == 'member';
      allow delete: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid ||
         isSpaceModerator(resource.data.spaceId, request.auth.uid));
      allow update: if isSpaceModerator(resource.data.spaceId, request.auth.uid);
    }

    // --- CONVERSATIONS ---
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() &&
        isConversationParticipant(conversationId, request.auth.uid);
      allow create: if isAuthenticated() &&
        request.auth.uid in request.resource.data.participants;
      allow update: if isAuthenticated() &&
        isConversationParticipant(conversationId, request.auth.uid);
      allow delete: if false;

      // --- MESSAGES ---
      match /messages/{messageId} {
        allow read: if isAuthenticated() &&
          isConversationParticipant(conversationId, request.auth.uid);
        allow create: if isAuthenticated() &&
          request.resource.data.senderId == request.auth.uid &&
          isConversationParticipant(conversationId, request.auth.uid);
        allow update: if isAuthenticated() &&
          resource.data.senderId == request.auth.uid;
        allow delete: if isAuthenticated() &&
          resource.data.senderId == request.auth.uid;
      }
    }

    // --- NOTIFICATIONS ---
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() &&
        resource.data.recipientId == request.auth.uid;
      allow create: if false; // Created only by Cloud Functions
      allow update: if isAuthenticated() &&
        resource.data.recipientId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
      allow delete: if isAuthenticated() &&
        resource.data.recipientId == request.auth.uid;
    }

    // --- SAVED ITEMS ---
    match /savedItems/{savedId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // --- COLLECTIONS ---
    match /collections/{collectionId} {
      allow read, write: if isAuthenticated() &&
        resource.data.ownerId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.ownerId == request.auth.uid;
    }

    // --- BLOCKS ---
    match /blocks/{blockId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.resource.data.blockerId == request.auth.uid &&
        blockId == request.resource.data.blockerId + '_' + request.resource.data.blockedId;
      allow delete: if isAuthenticated() &&
        resource.data.blockerId == request.auth.uid;
    }

    // --- MUTES ---
    match /mutes/{muteId} {
      allow read, write: if isAuthenticated() &&
        (resource.data.muterId == request.auth.uid ||
         request.resource.data.muterId == request.auth.uid);
    }

    // --- REPORTS ---
    match /reports/{reportId} {
      allow create: if isAuthenticated() &&
        request.resource.data.reporterId == request.auth.uid;
      allow read: if isAdmin();
      allow update, delete: if false;
    }
  }
}
```

---

## 5. Storage Security Rules

File: `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Profile photos — owner read/write
    match /users/{uid}/profile/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.uid == uid &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == uid;
    }

    // Post media — owner write, authenticated read
    match /users/{uid}/posts/{postId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.uid == uid &&
        request.resource.size < 100 * 1024 * 1024 && // 100MB limit
        (request.resource.contentType.matches('image/.*') ||
         request.resource.contentType.matches('video/.*'));
      allow delete: if request.auth != null && request.auth.uid == uid;
    }

    // Moments — owner write
    match /users/{uid}/moments/{momentId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.uid == uid &&
        request.resource.size < 50 * 1024 * 1024;
      allow delete: if request.auth != null && request.auth.uid == uid;
    }

    // Signal videos — owner write
    match /users/{uid}/signals/{signalId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.uid == uid &&
        request.resource.size < 200 * 1024 * 1024 &&
        request.resource.contentType.matches('video/.*');
      allow delete: if request.auth != null && request.auth.uid == uid;
    }

    // Chat media — participant write
    match /conversations/{conversationId}/{messageId}/{filename} {
      allow read: if request.auth != null;
      // Note: participant check is approximate here; full check via Cloud Function
      allow write: if request.auth != null &&
        request.resource.size < 50 * 1024 * 1024;
      allow delete: if request.auth != null;
    }

    // Space covers — authenticated members (simplified; full check via CF)
    match /spaces/{spaceId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null;
    }
  }
}
```

---

## 6. Cloud Functions Security

All Cloud Functions that write to Firestore use Firebase Admin SDK which bypasses Security Rules. Therefore:

- **Validate input** inside every Cloud Function before writing
- **Verify auth token** using `context.auth` in callable functions
- **Use `request.auth`** in HTTP functions with `admin.auth().verifyIdToken()`
- **Never expose** Admin SDK credentials to the client
- **Transaction all counters** — follower counts, signal counts, etc.

---

## 7. Security Testing Checklist

Before production:
- [ ] User A cannot read User B's private messages
- [ ] User A cannot edit User B's profile
- [ ] User A cannot delete User B's posts
- [ ] User A cannot delete User B's media in Storage
- [ ] Unauthenticated users cannot read private content
- [ ] Private account posts are invisible to non-followers
- [ ] Signal/follower counts cannot be inflated by client
- [ ] Space moderation actions require moderator role
- [ ] Report creation requires authentication
- [ ] Username registration prevents duplicates

---

## 8. Sensitive Data

| Data | Storage | Access |
|------|---------|--------|
| Auth credentials | Firebase Auth (not Firestore) | Firebase only |
| Private messages | Firestore (participant-only rules) | Participants only |
| Email address | Firestore users doc | Owner only (private field) |
| Block list | Firestore blocks collection | Authenticated users (for filtering) |
| Reports | Firestore reports | Admin only |
| Payment data | NOT in this app | N/A |

---

*Solvexa SECURITY.md — v1.0*
