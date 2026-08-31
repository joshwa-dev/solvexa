import {
  CURRENT_USER_MOCK,
  MOCK_USERS,
  MOCK_POSTS,
  MOCK_MOMENTS,
  MOCK_SIGNALS,
  MOCK_SPACES,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_NOTIFICATIONS,
} from '../../lib/mockData';
import type { SolvexaUser, IdentityCard } from '../../types/user.types';
import type { Post, Comment, SignalType } from '../../types/post.types';
import type { MomentWithAuthor } from '../../types/moment.types';
import type { SignalVideo } from '../../types/signal.types';
import type { Space } from '../../types/space.types';
import type { Conversation, Message, ContextSharePayload } from '../../types/message.types';
import type { Notification } from '../../types/notification.types';
import {
  createPostInFirestore,
  getPostsFromFirestore,
  updatePostInFirestore,
  deletePostInFirestore,
} from '../firestore/postService';
import {
  createSignalInFirestore,
  getSignalsFromFirestore,
  updateSignalInFirestore,
  deleteSignalInFirestore,
} from '../firestore/signalService';
import {
  createStoryInFirestore,
  getActiveStoriesFromFirestore,
} from '../firestore/storyService';
import { markConversationReadInFirestore } from '../firestore/nexusService';
import { logActivityEvent } from '../firestore/activityService';

export type DataMode = 'REAL' | 'DEMO';

// Persistent storage helper
const STORAGE_KEYS = {
  MODE: 'solvexa_data_mode',
  USER: 'solvexa_current_user',
  POSTS: 'solvexa_posts',
  MOMENTS: 'solvexa_moments',
  SIGNALS: 'solvexa_signals',
  SPACES: 'solvexa_spaces',
  CONVERSATIONS: 'solvexa_conversations',
  MESSAGES: 'solvexa_messages',
  NOTIFICATIONS: 'solvexa_notifications',
  USERS: 'solvexa_users',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Anonymous skeleton — real user is always set by AuthContext from Firebase Auth.
const ANONYMOUS_USER_SKELETON: SolvexaUser = {
  uid: 'user_anonymous',
  displayName: 'Guest User',
  username: 'guest',
  email: '',
  photoURL: null,
  coverPhotoURL: null,
  bio: '',
  location: '',
  website: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  followerCount: 0,
  followingCount: 0,
  signalCount: 0,
  spaceCount: 0,
  resonanceScore: 0,
  isPrivate: false,
  onboardingComplete: false,
  privacySettings: {
    whoCanMessage: 'everyone',
    whoCanMention: 'everyone',
    whoCanComment: 'everyone',
    activityVisible: true,
  },
  notificationPrefs: {
    signals: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true,
    spaceActivity: true,
    momentReplies: true,
  },
  identityCards: [],
};

class DataStore {
  private dataMode: DataMode = (localStorage.getItem(STORAGE_KEYS.MODE) as DataMode) || 'REAL';

  private currentUser: SolvexaUser = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.USER, CURRENT_USER_MOCK)
    : getStored(STORAGE_KEYS.USER, ANONYMOUS_USER_SKELETON);

  private users: SolvexaUser[] = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.USERS, MOCK_USERS)
    : getStored(STORAGE_KEYS.USERS, []);

  private posts: Post[] = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.POSTS, MOCK_POSTS)
    : getStored(STORAGE_KEYS.POSTS, []);

  private moments: MomentWithAuthor[] = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.MOMENTS, MOCK_MOMENTS)
    : getStored(STORAGE_KEYS.MOMENTS, []);

  private signals: SignalVideo[] = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.SIGNALS, MOCK_SIGNALS)
    : getStored(STORAGE_KEYS.SIGNALS, []);

  private spaces: Space[] = getStored(STORAGE_KEYS.SPACES, MOCK_SPACES);

  private conversations: Conversation[] = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.CONVERSATIONS, MOCK_CONVERSATIONS)
    : getStored(STORAGE_KEYS.CONVERSATIONS, []);

  private messages: Record<string, Message[]> = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.MESSAGES, MOCK_MESSAGES)
    : getStored(STORAGE_KEYS.MESSAGES, {});

  private notifications: Notification[] = this.dataMode === 'DEMO'
    ? getStored(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS)
    : getStored(STORAGE_KEYS.NOTIFICATIONS, []);

  private comments: Record<string, Comment[]> = {};
  private listeners: Set<() => void> = new Set();
  private isFirestoreSynced: boolean = false;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- MODE CONTROL ---
  public getDataMode(): DataMode {
    return this.dataMode;
  }

  public setDataMode(mode: DataMode): void {
    this.dataMode = mode;
    localStorage.setItem(STORAGE_KEYS.MODE, mode);

    if (mode === 'DEMO') {
      this.currentUser = { ...CURRENT_USER_MOCK };
      this.users = [...MOCK_USERS];
      this.posts = [...MOCK_POSTS];
      this.moments = [...MOCK_MOMENTS];
      this.signals = [...MOCK_SIGNALS];
      this.conversations = [...MOCK_CONVERSATIONS];
      this.messages = { ...MOCK_MESSAGES };
      this.notifications = [...MOCK_NOTIFICATIONS];
    } else {
      this.currentUser = { ...ANONYMOUS_USER_SKELETON };
      this.users = [];
      this.posts = [];
      this.moments = [];
      this.signals = [];
      this.conversations = [];
      this.messages = {};
      this.notifications = [];
      this.isFirestoreSynced = false;
      this.syncFromFirestore();
    }

    setStored(STORAGE_KEYS.USER, this.currentUser);
    setStored(STORAGE_KEYS.USERS, this.users);
    setStored(STORAGE_KEYS.POSTS, this.posts);
    setStored(STORAGE_KEYS.MOMENTS, this.moments);
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    setStored(STORAGE_KEYS.MESSAGES, this.messages);
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    this.notify();
  }

  /**
   * Syncs real posts and signals from Firestore when in REAL mode
   */
  public async syncFromFirestore(): Promise<void> {
    if (this.dataMode !== 'REAL') return;

    try {
      const [firestorePosts, firestoreSignals, firestoreStories] = await Promise.all([
        getPostsFromFirestore().catch(() => []),
        getSignalsFromFirestore().catch(() => []),
        getActiveStoriesFromFirestore().catch(() => []),
      ]);

      if (firestorePosts && firestorePosts.length > 0) {
        this.posts = firestorePosts;
        setStored(STORAGE_KEYS.POSTS, this.posts);
      }

      if (firestoreSignals && firestoreSignals.length > 0) {
        this.signals = firestoreSignals;
        setStored(STORAGE_KEYS.SIGNALS, this.signals);
      }

      if (firestoreStories && firestoreStories.length > 0) {
        this.moments = firestoreStories;
        setStored(STORAGE_KEYS.MOMENTS, this.moments);
      }

      this.isFirestoreSynced = true;
      this.notify();
    } catch (err) {
      console.warn('[dataStore] Firestore background sync warning:', err);
    }
  }

  // --- USER METHODS ---
  public getCurrentUser(): SolvexaUser {
    return this.currentUser;
  }

  public setCurrentUser(user: SolvexaUser): void {
    this.currentUser = user;
    setStored(STORAGE_KEYS.USER, user);
    this.notify();

    // Trigger Firestore load if newly authenticated
    if (this.dataMode === 'REAL' && user.uid && !user.uid.startsWith('user_anonymous') && !this.isFirestoreSynced) {
      this.syncFromFirestore();
    }
  }

  public updateCurrentUser(updates: Partial<SolvexaUser>): SolvexaUser {
    this.currentUser = { ...this.currentUser, ...updates, updatedAt: new Date().toISOString() };
    setStored(STORAGE_KEYS.USER, this.currentUser);
    this.notify();
    return this.currentUser;
  }

  public clearUserSession(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('solvexa_guest_mode');
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    this.dataMode = 'REAL';
    localStorage.setItem(STORAGE_KEYS.MODE, 'REAL');
    this.currentUser = { ...ANONYMOUS_USER_SKELETON };
    this.posts = [];
    this.signals = [];
    this.moments = [];
    this.conversations = [];
    this.messages = {};
    this.notifications = [];
    this.users = [];
    this.isFirestoreSynced = false;

    setStored(STORAGE_KEYS.USER, this.currentUser);
    setStored(STORAGE_KEYS.POSTS, this.posts);
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    setStored(STORAGE_KEYS.MESSAGES, this.messages);
    setStored(STORAGE_KEYS.USERS, this.users);

    this.notify();
  }

  public getUsers(): SolvexaUser[] {
    if (this.dataMode === 'DEMO') {
      return [...this.users];
    }

    const userMap = new Map<string, SolvexaUser>();

    // 1. Explicitly cached users
    this.users.forEach((u) => {
      if (u.uid && !u.uid.startsWith('guest_')) userMap.set(u.uid, u);
    });

    // 2. Currently authenticated user
    if (this.currentUser?.uid && !this.currentUser.uid.startsWith('guest_') && !this.currentUser.uid.startsWith('user_anonymous')) {
      userMap.set(this.currentUser.uid, this.currentUser);
    }

    // 3. Authors from real signals
    this.signals.forEach((s) => {
      if (s.authorId && !userMap.has(s.authorId) && !s.authorId.startsWith('guest_')) {
        userMap.set(s.authorId, {
          uid: s.authorId,
          displayName: s.authorName || 'Solvexa Pioneer',
          username: s.authorUsername || 'pioneer',
          email: '',
          photoURL: s.authorAvatar || null,
          coverPhotoURL: null,
          bio: 'Network researcher & signal pioneer.',
          location: 'Mesh Network',
          website: '',
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          followerCount: s.resonanceCount || 1,
          followingCount: 0,
          signalCount: 1,
          spaceCount: 0,
          resonanceScore: s.resonanceCount || 1,
          isPrivate: false,
          onboardingComplete: true,
          privacySettings: {
            whoCanMessage: 'everyone',
            whoCanMention: 'everyone',
            whoCanComment: 'everyone',
            activityVisible: true,
          },
          notificationPrefs: {
            signals: true,
            comments: true,
            follows: true,
            mentions: true,
            messages: true,
            spaceActivity: true,
            momentReplies: true,
          },
          identityCards: [{ id: '1', label: 'Signal Pioneer', icon: 'sensors', order: 1, category: 'role' }],
        });
      }
    });

    // 4. Authors from real posts
    this.posts.forEach((p) => {
      if (p.authorId && !userMap.has(p.authorId) && !p.authorId.startsWith('guest_')) {
        userMap.set(p.authorId, {
          uid: p.authorId,
          displayName: p.authorName || 'Solvexa Pioneer',
          username: p.authorUsername || 'pioneer',
          email: '',
          photoURL: p.authorAvatar || null,
          coverPhotoURL: null,
          bio: 'Network researcher & broadcast pioneer.',
          location: 'Mesh Network',
          website: '',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          followerCount: p.signalCount || 1,
          followingCount: 0,
          signalCount: 1,
          spaceCount: 0,
          resonanceScore: p.signalCount || 1,
          isPrivate: false,
          onboardingComplete: true,
          privacySettings: {
            whoCanMessage: 'everyone',
            whoCanMention: 'everyone',
            whoCanComment: 'everyone',
            activityVisible: true,
          },
          notificationPrefs: {
            signals: true,
            comments: true,
            follows: true,
            mentions: true,
            messages: true,
            spaceActivity: true,
            momentReplies: true,
          },
          identityCards: [{ id: '1', label: 'Signal Pioneer', icon: 'sensors', order: 1, category: 'role' }],
        });
      }
    });

    return Array.from(userMap.values());
  }

  public cacheUser(user: SolvexaUser): void {
    if (!user || !user.uid) return;
    const existingIndex = this.users.findIndex((u) => u.uid === user.uid);
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...user };
    } else {
      this.users.push(user);
    }
    setStored(STORAGE_KEYS.USERS, this.users);
    this.notify();
  }

  public getUser(idOrUsername: string): SolvexaUser | undefined {
    if (!idOrUsername) return undefined;
    const clean = idOrUsername.trim().toLowerCase().replace(/^@/, '');

    // 1. Check currentUser first
    if (
      this.currentUser &&
      (this.currentUser.uid === idOrUsername ||
        this.currentUser.username?.toLowerCase() === clean)
    ) {
      return this.currentUser;
    }

    // 2. Check cached/in-memory users
    const all = this.getUsers();
    const found = all.find(
      (u) =>
        u.uid === idOrUsername ||
        u.username?.toLowerCase() === clean ||
        u.displayName?.toLowerCase() === clean
    );
    if (found) return found;

    // 3. Fallback to MOCK_USERS if in DEMO mode or mock id
    if (
      this.dataMode === 'DEMO' ||
      idOrUsername.startsWith('user_') ||
      idOrUsername.startsWith('usr_')
    ) {
      const mockFound = MOCK_USERS.find(
        (u) =>
          u.uid === idOrUsername ||
          u.username?.toLowerCase() === clean ||
          u.displayName?.toLowerCase() === clean
      );
      if (mockFound) return mockFound;
    }

    return undefined;
  }

  public toggleFollowUser(uid: string, forceState?: boolean): boolean {
    let user = this.users.find((u) => u.uid === uid);
    if (!user && this.dataMode === 'DEMO') {
      const mock = MOCK_USERS.find((u) => u.uid === uid);
      if (mock) {
        user = { ...mock };
        this.users.push(user);
      }
    }
    if (!user) return false;

    const nextState = typeof forceState === 'boolean' ? forceState : !user.isFollowing;
    if (user.isFollowing === nextState) return nextState;

    user.isFollowing = nextState;
    user.followerCount = Math.max(0, (user.followerCount || 0) + (nextState ? 1 : -1));

    if (this.currentUser) {
      this.currentUser.followingCount = Math.max(
        0,
        (this.currentUser.followingCount || 0) + (nextState ? 1 : -1)
      );
      setStored(STORAGE_KEYS.USER, this.currentUser);
    }

    setStored(STORAGE_KEYS.USERS, this.users);
    this.notify();
    return user.isFollowing;
  }

  public addIdentityCard(card: IdentityCard): void {
    if (!this.currentUser) return;
    this.currentUser.identityCards = [...(this.currentUser.identityCards || []), card];
    setStored(STORAGE_KEYS.USER, this.currentUser);
    this.notify();
  }

  public removeIdentityCard(cardId: string): void {
    if (!this.currentUser) return;
    this.currentUser.identityCards = this.currentUser.identityCards.filter((c) => c.id !== cardId);
    setStored(STORAGE_KEYS.USER, this.currentUser);
    this.notify();
  }

  // --- POSTS ---
  public getPosts(): Post[] {
    return [...this.posts];
  }

  public getSavedPosts(): Post[] {
    return this.posts.filter((p) => p.isSaved);
  }

  public getPostById(postId: string): Post | undefined {
    return this.posts.find((p) => p.postId === postId);
  }

  public createPost(data: Partial<Post>): Post {
    const author = this.currentUser || {
      uid: 'user_anonymous',
      displayName: 'Solvexa Pioneer',
      username: 'pioneer',
      photoURL: null,
    };

    const newPost: Post = {
      postId: `post_${Date.now()}`,
      authorId: author.uid,
      authorName: author.displayName || 'Solvexa Pioneer',
      authorUsername: author.username || 'pioneer',
      authorAvatar: author.photoURL || null,
      content: data.content || '',

      media: data.media || [],
      mediaType: data.media && data.media.length > 0 ? (data.media.length > 1 ? 'multi' : 'image') : 'none',
      postType: data.postType || 'text',
      createdAt: new Date().toISOString(),
      visibility: data.visibility || 'public',
      spaceId: data.spaceId || null,
      spaceName: data.spaceName || null,
      topics: data.topics || ['SignalFlow'],
      commentCount: 0,
      signalCount: 1,
      shareCount: 0,
      saveCount: 0,
      location: data.location || null,
      pollOptions: data.pollOptions || null,
      mySignal: 'insightful',
      isSaved: false,
    };

    this.posts = [newPost, ...this.posts];
    if (this.currentUser) {
      this.currentUser.signalCount += 1;
      setStored(STORAGE_KEYS.USER, this.currentUser);
    }
    setStored(STORAGE_KEYS.POSTS, this.posts);
    this.notify();

    // Persist to Firestore in REAL mode
    if (this.dataMode === 'REAL' && author.uid && !author.uid.startsWith('user_anonymous') && !author.uid.startsWith('guest_')) {
      createPostInFirestore(newPost).catch((err) => {
        console.error('[dataStore] Failed to persist post to Firestore:', err);
      });
    }

    logActivityEvent('post_created', { postId: newPost.postId });

    return newPost;
  }

  public async editPost(postId: string, updates: Partial<Post>): Promise<void> {
    const postIndex = this.posts.findIndex((p) => p.postId === postId);
    if (postIndex === -1) {
      throw new Error('Post not found');
    }

    const previousPost = { ...this.posts[postIndex] };
    this.posts[postIndex] = { ...this.posts[postIndex], ...updates, updatedAt: new Date().toISOString() };
    setStored(STORAGE_KEYS.POSTS, this.posts);
    this.notify();

    if (this.dataMode === 'REAL' && this.currentUser?.uid && !this.currentUser.uid.startsWith('guest_')) {
      try {
        await updatePostInFirestore(postId, updates);
      } catch (err) {
        // Rollback on error
        this.posts[postIndex] = previousPost;
        setStored(STORAGE_KEYS.POSTS, this.posts);
        this.notify();
        throw err;
      }
    }
  }

  public async deletePost(postId: string): Promise<void> {
    const postIndex = this.posts.findIndex((p) => p.postId === postId);
    if (postIndex === -1) return;

    const previousPost = this.posts[postIndex];
    this.posts = this.posts.filter((p) => p.postId !== postId);
    setStored(STORAGE_KEYS.POSTS, this.posts);
    this.notify();

    if (this.dataMode === 'REAL' && this.currentUser?.uid && !this.currentUser.uid.startsWith('guest_')) {
      try {
        await deletePostInFirestore(postId);
      } catch (err) {
        // Rollback on error
        this.posts = [previousPost, ...this.posts];
        setStored(STORAGE_KEYS.POSTS, this.posts);
        this.notify();
        throw err;
      }
    }
  }

  public toggleSignal(postId: string, signalType: SignalType): void {
    const post = this.posts.find((p) => p.postId === postId);
    if (!post) return;

    if (post.mySignal === signalType) {
      post.mySignal = null;
      post.signalCount = Math.max(0, post.signalCount - 1);
    } else {
      if (!post.mySignal) {
        post.signalCount += 1;
      }
      post.mySignal = signalType;
    }

    setStored(STORAGE_KEYS.POSTS, this.posts);
    this.notify();
  }

  public toggleSavePost(postId: string): boolean {
    const post = this.posts.find((p) => p.postId === postId);
    if (!post) return false;

    post.isSaved = !post.isSaved;
    post.saveCount += post.isSaved ? 1 : -1;
    setStored(STORAGE_KEYS.POSTS, this.posts);
    this.notify();
    return !!post.isSaved;
  }

  public votePoll(postId: string, optionId: string): void {
    const post = this.posts.find((p) => p.postId === postId);
    if (!post || !post.pollOptions) return;

    const uid = this.currentUser?.uid || 'user_anonymous';

    post.pollOptions.forEach((opt) => {
      opt.votedUserIds = opt.votedUserIds || [];
      if (opt.votedUserIds.includes(uid) && opt.id !== optionId) {
        opt.voteCount = Math.max(0, opt.voteCount - 1);
        opt.votedUserIds = opt.votedUserIds.filter((id) => id !== uid);
      }
    });

    const targetOpt = post.pollOptions.find((o) => o.id === optionId);
    if (targetOpt) {
      targetOpt.votedUserIds = targetOpt.votedUserIds || [];
      if (!targetOpt.votedUserIds.includes(uid)) {
        targetOpt.voteCount += 1;
        targetOpt.votedUserIds.push(uid);
      }
      setStored(STORAGE_KEYS.POSTS, this.posts);
      this.notify();
    }
  }

  // --- COMMENTS ---
  public getComments(postId: string): Comment[] {
    return this.comments[postId] || [];
  }

  public addComment(postId: string, content: string, replyTo: string | null = null): Comment {
    const author = this.currentUser || {
      uid: 'user_anonymous',
      displayName: 'Solvexa Pioneer',
      username: 'pioneer',
      photoURL: null,
    };

    const comment: Comment = {
      commentId: `com_${Date.now()}`,
      postId,
      authorId: author.uid,
      authorName: author.displayName || 'Solvexa Pioneer',
      authorUsername: author.username || 'pioneer',
      authorAvatar: author.photoURL || null,
      content,
      createdAt: new Date().toISOString(),
      replyTo,
      signalCount: 1,
    };

    if (!this.comments[postId]) {
      this.comments[postId] = [];
    }
    this.comments[postId].push(comment);

    const post = this.posts.find((p) => p.postId === postId);
    if (post) {
      post.commentCount += 1;
      setStored(STORAGE_KEYS.POSTS, this.posts);
    }

    this.notify();
    return comment;
  }

  // --- MOMENTS ---
  public getMoments(): MomentWithAuthor[] {
    return [...this.moments];
  }

  public markMomentViewed(momentId: string): void {
    const mom = this.moments.find((m) => m.momentId === momentId);
    if (mom && !mom.hasViewed) {
      mom.hasViewed = true;
      mom.viewCount += 1;
      setStored(STORAGE_KEYS.MOMENTS, this.moments);
      this.notify();
    }
  }

  public createMoment(data: { media: string | null; text: string | null; mediaType: any; backgroundColor?: string }): MomentWithAuthor {
    const author = this.currentUser || {
      uid: 'user_anonymous',
      displayName: 'Solvexa Pioneer',
      username: 'pioneer',
      photoURL: null,
    };

    const newMoment: MomentWithAuthor = {
      momentId: `mom_${Date.now()}`,
      authorId: author.uid,
      media: data.media,
      mediaType: data.mediaType || 'photo',
      backgroundColor: data.backgroundColor || '#1c0f38',
      text: data.text,
      visibility: 'public',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 1,
      signalCount: 0,
      hasViewed: false,
      author: {
        uid: author.uid,
        displayName: author.displayName,
        username: author.username,
        photoURL: author.photoURL,
      }
    };

    this.moments = [newMoment, ...this.moments];
    setStored(STORAGE_KEYS.MOMENTS, this.moments);
    this.notify();

    if (this.dataMode === 'REAL' && author.uid && !author.uid.startsWith('user_anonymous') && !author.uid.startsWith('guest_')) {
      createStoryInFirestore({
        mediaUrl: data.media,
        mediaType: data.mediaType === 'video' ? 'video' : 'photo',
        text: data.text,
        backgroundColor: data.backgroundColor,
      }).catch((err) => console.error('[dataStore] Failed to persist story to Firestore:', err));
    }

    logActivityEvent('story_created', { momentId: newMoment.momentId });

    return newMoment;
  }

  // --- SIGNALS (VIDEOS) ---
  public getSignals(): SignalVideo[] {
    return [...this.signals];
  }

  public addSignal(signal: SignalVideo): void {
    this.signals = [signal, ...this.signals];
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    this.notify();

    // Persist to Firestore in REAL mode
    if (this.dataMode === 'REAL' && signal.authorId && !signal.authorId.startsWith('user_anonymous') && !signal.authorId.startsWith('guest_')) {
      createSignalInFirestore(signal).catch((err) => {
        console.error('[dataStore] Failed to persist signal to Firestore:', err);
      });
    }

    logActivityEvent('signal_created', { signalId: signal.id });
  }

  public async editSignal(signalId: string, updates: Partial<SignalVideo>): Promise<void> {
    const signalIndex = this.signals.findIndex((s) => s.id === signalId);
    if (signalIndex === -1) {
      throw new Error('Signal not found');
    }

    const previousSignal = { ...this.signals[signalIndex] };
    this.signals[signalIndex] = { ...this.signals[signalIndex], ...updates };
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    this.notify();

    if (this.dataMode === 'REAL' && this.currentUser?.uid && !this.currentUser.uid.startsWith('guest_')) {
      try {
        await updateSignalInFirestore(signalId, updates);
      } catch (err) {
        // Rollback on error
        this.signals[signalIndex] = previousSignal;
        setStored(STORAGE_KEYS.SIGNALS, this.signals);
        this.notify();
        throw err;
      }
    }
  }

  public async deleteSignal(signalId: string): Promise<void> {
    const signalIndex = this.signals.findIndex((s) => s.id === signalId);
    if (signalIndex === -1) return;

    const previousSignal = this.signals[signalIndex];
    this.signals = this.signals.filter((s) => s.id !== signalId);
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    this.notify();

    if (this.dataMode === 'REAL' && this.currentUser?.uid && !this.currentUser.uid.startsWith('guest_')) {
      try {
        await deleteSignalInFirestore(signalId);
      } catch (err) {
        // Rollback on error
        this.signals = [previousSignal, ...this.signals];
        setStored(STORAGE_KEYS.SIGNALS, this.signals);
        this.notify();
        throw err;
      }
    }
  }

  public toggleResonateSignal(signalId: string): boolean {
    const sig = this.signals.find((s) => s.id === signalId);
    if (!sig) return false;

    sig.isResonated = !sig.isResonated;
    sig.resonanceCount += sig.isResonated ? 1 : -1;
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    this.notify();
    return !!sig.isResonated;
  }

  public toggleBookmarkSignal(signalId: string): boolean {
    const sig = this.signals.find((s) => s.id === signalId);
    if (!sig) return false;

    sig.isBookmarked = !sig.isBookmarked;
    setStored(STORAGE_KEYS.SIGNALS, this.signals);
    this.notify();
    return !!sig.isBookmarked;
  }

  // --- SPACES ---
  public getSpaces(): Space[] {
    return [...this.spaces];
  }

  public getSpaceById(spaceId: string): Space | undefined {
    return this.spaces.find((s) => s.id === spaceId || s.handle === spaceId);
  }

  public toggleJoinSpace(spaceId: string): boolean {
    const space = this.spaces.find((s) => s.id === spaceId || s.handle === spaceId);
    if (!space) return false;

    space.isJoined = !space.isJoined;
    space.memberCount += space.isJoined ? 1 : -1;
    if (this.currentUser) {
      this.currentUser.spaceCount = Math.max(0, this.currentUser.spaceCount + (space.isJoined ? 1 : -1));
      setStored(STORAGE_KEYS.USER, this.currentUser);
    }

    setStored(STORAGE_KEYS.SPACES, this.spaces);
    this.notify();
    return !!space.isJoined;
  }

  public createSpace(data: { name: string; handle?: string; description: string; category: any; icon?: string; iconUrl?: string }): Space {
    const handle = data.handle
      ? data.handle.replace(/^@/, '')
      : data.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const newSpace: Space = {
      id: `space_${Date.now()}`,
      name: data.name,
      handle,
      description: data.description,
      category: data.category,
      iconUrl: data.iconUrl || data.icon || 'hub',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      memberCount: 1,
      postCount: 1,
      isJoined: true,
      createdBy: this.currentUser?.uid || 'user_anonymous',
      createdAt: new Date().toISOString(),
      isPrivate: false,
      rules: ['Respect open research protocol', 'Signal-to-noise ratio matters'],
    };

    this.spaces = [newSpace, ...this.spaces];
    if (this.currentUser) {
      this.currentUser.spaceCount += 1;
      setStored(STORAGE_KEYS.USER, this.currentUser);
    }
    setStored(STORAGE_KEYS.SPACES, this.spaces);
    this.notify();
    return newSpace;
  }

  // --- CONVERSATIONS & MESSAGES ---
  public getConversations(): Conversation[] {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    return this.conversations.filter((c) => c.participants.includes(currentUid));
  }

  public getOrCreateConversation(targetUser: {
    uid: string;
    displayName: string;
    username: string;
    photoURL?: string | null;
  }): Conversation {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    const sortedUids = [currentUid, targetUser.uid].sort();
    const deterministicId = `direct_${sortedUids[0]}_${sortedUids[1]}`;

    const existing = this.conversations.find((c) =>
      c.conversationId === deterministicId ||
      (c.type === 'direct' && c.participants.includes(targetUser.uid) && c.participants.includes(currentUid))
    );
    if (existing) {
      return existing;
    }

    const newConv: Conversation = {
      conversationId: deterministicId,
      type: 'direct',
      participants: [currentUid, targetUser.uid],
      participantDetails: [
        {
          uid: currentUid,
          displayName: this.currentUser?.displayName || 'You',
          username: this.currentUser?.username || 'user',
          photoURL: this.currentUser?.photoURL || null,
        },
        {
          uid: targetUser.uid,
          displayName: targetUser.displayName,
          username: targetUser.username,
          photoURL: targetUser.photoURL || null,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      unreadCounts: { [currentUid]: 0, [targetUser.uid]: 0 },
      groupName: null,
      groupAvatar: null,
      createdBy: currentUid,
    };

    this.conversations = [newConv, ...this.conversations];
    setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.notify();
    return newConv;
  }

  public addOrUpdateConversation(conv: Conversation): void {
    if (!conv || !conv.conversationId) return;
    const index = this.conversations.findIndex((c) => c.conversationId === conv.conversationId);
    if (index >= 0) {
      this.conversations[index] = { ...this.conversations[index], ...conv };
    } else {
      this.conversations = [conv, ...this.conversations];
    }
    setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.notify();
  }

  public getMessages(conversationId: string): Message[] {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    const list = this.messages[conversationId] || [];
    return list.filter((m) => !m.deletedFor?.includes(currentUid));
  }

  public sendMessage(
    conversationId: string,
    content: string,
    payload?: Partial<Message>,
    clientMessageId?: string
  ): Message {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    const newMsg: Message = {
      messageId: clientMessageId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      senderId: currentUid,
      content,
      type: payload?.type || 'text',
      sharedContent: payload?.sharedContent || null,
      media: payload?.media,
      sentAt: new Date().toISOString(),
      deletedFor: [],
      isDeletedForEveryone: false,
      isDeleted: false,
    };

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    // Prevent duplicate entries by messageId
    if (!this.messages[conversationId].some((m) => m.messageId === newMsg.messageId)) {
      this.messages[conversationId].push(newMsg);
    }

    const conv = this.conversations.find((c) => c.conversationId === conversationId);
    if (conv) {
      conv.lastMessage = {
        content: content || 'Shared an item',
        senderId: currentUid,
        sentAt: newMsg.sentAt,
        type: newMsg.type,
      };
      conv.updatedAt = newMsg.sentAt;
      setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    }

    setStored(STORAGE_KEYS.MESSAGES, this.messages);
    this.notify();
    logActivityEvent('message_sent', { conversationId });

    return newMsg;
  }

  public addOptimisticMessage(conversationId: string, msg: Message): void {
    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    if (!this.messages[conversationId].some((m) => m.messageId === msg.messageId)) {
      this.messages[conversationId].push(msg);
    }
    const conv = this.conversations.find((c) => c.conversationId === conversationId);
    if (conv) {
      conv.lastMessage = {
        content: msg.content || 'Shared an item',
        senderId: msg.senderId,
        sentAt: msg.sentAt,
        type: msg.type,
      };
      conv.updatedAt = msg.sentAt;
      setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    }
    setStored(STORAGE_KEYS.MESSAGES, this.messages);
    this.notify();
  }

  public removeMessage(conversationId: string, messageId: string): void {
    if (this.messages[conversationId]) {
      this.messages[conversationId] = this.messages[conversationId].filter(
        (m) => m.messageId !== messageId
      );
      setStored(STORAGE_KEYS.MESSAGES, this.messages);
      this.notify();
    }
  }

  /**
   * WhatsApp-Style: Delete Message For Me
   * Hides the message only from current user's view while keeping conversation and other users' history intact
   */
  public deleteMessageForMe(conversationId: string, messageId: string): void {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    const msg = this.messages[conversationId]?.find((m) => m.messageId === messageId);
    if (msg) {
      msg.deletedFor = msg.deletedFor || [];
      if (!msg.deletedFor.includes(currentUid)) {
        msg.deletedFor.push(currentUid);
      }
      setStored(STORAGE_KEYS.MESSAGES, this.messages);
      this.notify();
    }
  }

  /**
   * WhatsApp-Style: Delete Message For Everyone (Author only)
   * Replaces content with "This message was deleted" and marks isDeletedForEveryone
   */
  public deleteMessageForEveryone(conversationId: string, messageId: string): void {
    const msg = this.messages[conversationId]?.find((m) => m.messageId === messageId);
    if (msg) {
      msg.content = 'This message was deleted';
      msg.deleted = true;
      msg.isDeleted = true;
      msg.isDeletedForEveryone = true;
      msg.media = undefined;
      msg.sharedContent = null;
      setStored(STORAGE_KEYS.MESSAGES, this.messages);

      const conv = this.conversations.find((c) => c.conversationId === conversationId);
      if (conv && conv.lastMessage && conv.lastMessage.sentAt === msg.sentAt) {
        conv.lastMessage.content = 'This message was deleted';
        setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
      }

      this.notify();
    }
  }

  /**
   * Computes the real count of unread incoming messages across all active conversations
   */
  public getUnreadMessageCount(): number {
    const currentUid = this.currentUser?.uid;
    if (!currentUid || currentUid === 'user_anonymous' || currentUid.startsWith('guest_')) {
      return 0;
    }

    let count = 0;
    const userConvs = this.conversations.filter((c) => c.participants.includes(currentUid));

    for (const conv of userConvs) {
      if (conv.unreadCounts && typeof conv.unreadCounts[currentUid] === 'number') {
        count += conv.unreadCounts[currentUid];
      } else {
        const msgs = this.messages[conv.conversationId] || [];
        for (const m of msgs) {
          if (
            m.senderId !== currentUid &&
            !m.read &&
            !m.readAt &&
            (!m.deletedFor || !m.deletedFor.includes(currentUid))
          ) {
            count += 1;
          }
        }
      }
    }

    return count;
  }

  /**
   * Marks all messages in a conversation as read by the current user
   */
  public markConversationAsRead(conversationId: string): void {
    const currentUid = this.currentUser?.uid;
    if (!currentUid || currentUid === 'user_anonymous') return;

    let changed = false;
    const conv = this.conversations.find((c) => c.conversationId === conversationId);
    if (conv && conv.unreadCounts && conv.unreadCounts[currentUid] > 0) {
      conv.unreadCounts[currentUid] = 0;
      changed = true;
    }

    const msgs = this.messages[conversationId] || [];
    for (const m of msgs) {
      if (m.senderId !== currentUid && (!m.read || !m.readAt)) {
        m.read = true;
        m.readAt = new Date().toISOString();
        changed = true;
      }
    }

    if (changed) {
      setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
      setStored(STORAGE_KEYS.MESSAGES, this.messages);
      this.notify();

      if (
        this.dataMode === 'REAL' &&
        currentUid &&
        !currentUid.startsWith('user_anonymous') &&
        !currentUid.startsWith('guest_')
      ) {
        markConversationReadInFirestore(conversationId, currentUid).catch((err: unknown) => {
          console.warn('[dataStore] markConversationReadInFirestore warning:', err);
        });
      }
    }
  }

  public deleteMessage(conversationId: string, messageId: string): void {
    this.deleteMessageForMe(conversationId, messageId);
  }

  public shareContext(payload: ContextSharePayload, targetConversationId: string): void {
    const contextLabels: Record<string, string> = {
      thought_you_like: 'Thought you would resonate with this signal:',
      reminded_me: 'Reminded me of our recent discussion:',
      lets_discuss: 'Let’s analyze and discuss this:',
      check_this_out: 'Essential signal to check out:',
      custom: payload.customMessage || 'Shared signal:',
    };

    const label = contextLabels[payload.context] || 'Shared signal:';
    const note = payload.customMessage ? ` "${payload.customMessage}"` : '';
    const content = `[CONTEXT SHARE] ${label}${note}`;

    this.sendMessage(targetConversationId, content, {
      type: payload.sharedContent.type === 'post' ? 'shared_post' : 'shared_signal',
      sharedContent: payload.sharedContent,
    });
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): Notification[] {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    return this.notifications.filter((n) => n.recipientId === currentUid);
  }

  public getUnreadNotificationCount(): number {
    const currentUid = this.currentUser?.uid || 'user_anonymous';
    return this.notifications.filter((n) => n.recipientId === currentUid && !n.isRead).length;
  }

  public markNotificationRead(notificationId: string): void {
    const notif = this.notifications.find((n) => n.notificationId === notificationId);
    if (notif) {
      notif.isRead = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
    }
  }

  public markNotificationAsRead(notificationId: string): void {
    this.markNotificationRead(notificationId);
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach((n) => {
      n.isRead = true;
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public markAllNotificationsAsRead(): void {
    this.markAllNotificationsRead();
  }
}

export const dataStore = new DataStore();
