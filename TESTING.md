# TESTING.md — Solvexa Testing Strategy

---

## 1. Overview

Testing is organized into four layers:
1. **Unit tests** — pure functions, validators, formatters
2. **Firebase Security Rules tests** — using Firebase Emulator
3. **Integration tests** — feature flows against emulator
4. **Browser/E2E tests** — visual QA and user journey testing

---

## 2. Test Setup

### Dependencies
```bash
npm install --save-dev @firebase/rules-unit-testing vitest @testing-library/react @testing-library/user-event
```

### Test Environment
- All tests run against Firebase Emulator Suite
- Emulator data is seeded before test runs
- Tests NEVER touch production Firebase

### Run Tests
```bash
# Unit + Rules tests
npm run test

# With emulators
firebase emulators:exec "npm run test"

# Watch mode
npm run test:watch
```

---

## 3. Firebase Security Rules Tests

Location: `tests/rules/`

### firestore.rules.test.ts

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'solvexa-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterEach(async () => await testEnv.clearFirestore());
afterAll(async () => await testEnv.cleanup());

describe('Users collection', () => {
  test('Authenticated user can read public profiles', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(getDoc(doc(alice.firestore(), 'users', 'bob')));
  });

  test('Unauthenticated user cannot read profiles', async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), 'users', 'alice')));
  });

  test('User can create their own profile', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(setDoc(doc(alice.firestore(), 'users', 'alice'), {
      uid: 'alice',
      displayName: 'Alice',
      followerCount: 0,
      followingCount: 0,
      signalCount: 0,
    }));
  });

  test('User cannot create profile for another user', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(setDoc(doc(alice.firestore(), 'users', 'bob'), {
      uid: 'bob',
      displayName: 'Bob',
      followerCount: 0,
      followingCount: 0,
      signalCount: 0,
    }));
  });

  test('User cannot inflate follower count', async () => {
    const alice = testEnv.authenticatedContext('alice');
    // Setup
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'alice'), {
        uid: 'alice', followerCount: 0, followingCount: 0, signalCount: 0,
      });
    });
    // Test: client tries to set followerCount
    await assertFails(updateDoc(doc(alice.firestore(), 'users', 'alice'), {
      followerCount: 9999,
    }));
  });
});

describe('Posts collection', () => {
  test('Author can create a post with correct authorId', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(setDoc(doc(alice.firestore(), 'posts', 'post1'), {
      postId: 'post1',
      authorId: 'alice',
      content: 'Hello world',
      commentCount: 0,
      signalCount: 0,
      shareCount: 0,
      saveCount: 0,
      visibility: 'public',
      createdAt: new Date(),
    }));
  });

  test('User cannot create post with another authorId', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(setDoc(doc(alice.firestore(), 'posts', 'post2'), {
      postId: 'post2',
      authorId: 'bob', // Wrong — should be alice
      content: 'Impersonation',
      commentCount: 0,
      signalCount: 0,
      shareCount: 0,
      saveCount: 0,
      visibility: 'public',
    }));
  });

  test('User cannot delete another user post', async () => {
    const bob = testEnv.authenticatedContext('bob');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'posts', 'alicePost'), {
        authorId: 'alice', visibility: 'public',
        commentCount: 0, signalCount: 0, shareCount: 0, saveCount: 0,
      });
    });
    await assertFails(deleteDoc(doc(bob.firestore(), 'posts', 'alicePost')));
  });
});

describe('Messages (private)', () => {
  test('Participant can read conversation messages', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        participants: ['alice', 'bob'],
        type: 'direct',
      });
      await setDoc(doc(ctx.firestore(), 'conversations/conv1/messages', 'msg1'), {
        senderId: 'alice',
        content: 'Hello',
      });
    });
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(getDoc(doc(alice.firestore(), 'conversations/conv1/messages', 'msg1')));
  });

  test('Non-participant cannot read private conversation', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv2'), {
        participants: ['alice', 'bob'],
        type: 'direct',
      });
    });
    const charlie = testEnv.authenticatedContext('charlie');
    await assertFails(getDoc(doc(charlie.firestore(), 'conversations', 'conv2')));
  });
});

describe('Blocks', () => {
  test('User can block another user', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(setDoc(doc(alice.firestore(), 'blocks', 'alice_bob'), {
      blockId: 'alice_bob',
      blockerId: 'alice',
      blockedId: 'bob',
      createdAt: new Date(),
    }));
  });

  test('User cannot create block with wrong blocker ID', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(setDoc(doc(alice.firestore(), 'blocks', 'bob_charlie'), {
      blockId: 'bob_charlie',
      blockerId: 'bob', // Not alice
      blockedId: 'charlie',
    }));
  });
});
```

---

## 4. Authentication Tests

Location: `tests/auth/`

```typescript
// auth.test.ts

describe('Authentication', () => {
  test('Email signup creates user and Firestore profile', async () => { /* ... */ });
  test('Email login with correct credentials succeeds', async () => { /* ... */ });
  test('Email login with wrong password fails with error', async () => { /* ... */ });
  test('Google sign-in flow initiates popup', async () => { /* ... */ });
  test('Auth state persists across page reload', async () => { /* ... */ });
  test('Logout clears auth state', async () => { /* ... */ });
  test('Disabled account returns appropriate error', async () => { /* ... */ });
  test('Too many requests returns rate limit error', async () => { /* ... */ });
});
```

---

## 5. Feature Tests

### Posts
- Create post with text ? saved to Firestore
- Create post with image ? uploaded to Storage ? URL saved to Firestore
- Edit own post ? content updated
- Delete own post ? document removed + media cleanup triggered
- Cannot edit/delete another user's post

### Signals (Reactions)
- Send signal ? saves to `signals/{userId}_{postId}`
- Duplicate signal prevention ? second signal fails or updates
- Remove signal ? document deleted
- Signal count reflects in post document (via Cloud Function)

### Follows
- Follow user ? creates `follows/{follower}_{followed}`
- Unfollow ? deletes document
- Cannot follow same user twice

### Moments
- Create moment ? expiresAt is 24h after createdAt
- Expired moments excluded from queries
- View tracking works without duplicates

### Messages
- Send message ? appears in conversation
- Realtime listener receives new message without polling
- Read status updates on message view
- Non-participant cannot send to private conversation

### Spaces
- Join space ? creates spaceMembers document
- Leave space ? removes spaceMembers document
- Only moderator can remove other members

---

## 6. Component Tests

```typescript
// Using React Testing Library

describe('SignalButton', () => {
  test('Shows correct signal count', () => { /* ... */ });
  test('Clicking signal sends to Firestore', async () => { /* ... */ });
  test('Already-signalled shows filled state', () => { /* ... */ });
  test('Optimistic update on click', () => { /* ... */ });
});

describe('PostComposer', () => {
  test('Validates empty content on submit', () => { /* ... */ });
  test('Shows upload progress for images', async () => { /* ... */ });
  test('Cancels and cleans up on dismiss', () => { /* ... */ });
});

describe('AuthForms', () => {
  test('Email validation error shown', () => { /* ... */ });
  test('Password too short shown', () => { /* ... */ });
  test('Submit disabled during loading', () => { /* ... */ });
});
```

---

## 7. Browser QA Checklist (Manual + Automated)

### Authentication Journey
- [ ] Landing page loads correctly
- [ ] Sign up with email/password creates account
- [ ] Verification email sent (if enabled)
- [ ] Google sign-in popup opens and authenticates
- [ ] Onboarding flow appears after first login
- [ ] Returning user goes directly to Pulse
- [ ] Logout clears session
- [ ] Protected routes redirect to login

### Pulse Feed
- [ ] My Orbit row scrolls horizontally
- [ ] Moments strip visible and tappable
- [ ] Posts load with pagination
- [ ] Signal button works
- [ ] Comment button opens comments
- [ ] Save button works
- [ ] Share options appear

### Signals Video
- [ ] Full-screen vertical layout
- [ ] Signal button sends reaction
- [ ] Swipe/navigation to next video
- [ ] Creator follow button works
- [ ] Audio ticker scrolls

### Profile (Nexus)
- [ ] Avatar and cover display
- [ ] Stats row shows correct counts
- [ ] Edit profile saves changes
- [ ] Identity cards visible
- [ ] Post grid loads

### Messages
- [ ] Conversation list loads
- [ ] Send message appears in real-time
- [ ] New conversation can be created
- [ ] Read status updates

### Settings
- [ ] Privacy settings save
- [ ] Theme toggle works
- [ ] Account deletion flow works

---

## 8. Storage Rules Tests

```typescript
describe('Storage Rules', () => {
  test('User can upload profile photo to their path', async () => { /* ... */ });
  test('User cannot upload to another user path', async () => { /* ... */ });
  test('Large file rejected', async () => { /* ... */ });
  test('Non-image rejected for profile photo', async () => { /* ... */ });
  test('User can delete own media', async () => { /* ... */ });
  test('User cannot delete another user media', async () => { /* ... */ });
});
```

---

## 9. Performance Checks

- [ ] Initial page load < 3s on 3G simulation
- [ ] Feed scroll smooth at 60fps
- [ ] No unnecessary Firestore reads on re-renders
- [ ] Listeners unsubscribed on route change
- [ ] Images use lazy loading
- [ ] Videos do not autoplay when out of view
- [ ] Bundle size < 500KB initial (with code splitting)

---

## 10. Accessibility Checks

- [ ] All buttons have accessible labels
- [ ] Forms have proper label associations
- [ ] Focus trap in modal dialogs
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard-navigable navigation
- [ ] ARIA roles on custom components

---

*Solvexa TESTING.md — v1.0*
