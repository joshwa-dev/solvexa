import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import type { SolvexaUser } from '../../types/user.types';
import {
  getUserProfile,
  createUserProfile,
} from '../../services/auth/profileService';
import { getGoogleRedirectResult, signOutUser } from '../../services/auth/authService';
import { dataStore, type DataMode } from '../../services/store/dataStore';

export interface AuthContextValue {
  firebaseUser: User | null;
  solvexaUser: SolvexaUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  isGuest: boolean;
  dataMode: DataMode;
  refreshProfile: () => Promise<void>;
  signInAsGuest: (customName?: string) => void;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [solvexaUser, setSolvexaUser] = useState<SolvexaUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('solvexa_guest_mode') === 'true';
  });
  const [dataMode, setDataModeState] = useState<DataMode>(() => dataStore.getDataMode());
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: User) => {
    if (!user || !user.uid) return;

    if (import.meta.env.DEV) {
      console.log('[Firebase Auth]', {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        authenticated: true,
        uid: user.uid,
        email: user.email,
        documentPath: `users/${user.uid}`,
      });
    }

    try {
      // 1. Fetch existing profile document
      let profile = await getUserProfile(user.uid);

      // 2. If profile document does not exist yet, initialize it with authentic Firebase user data
      if (!profile) {
        const generatedUsername = (user.displayName || user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');

        const newProfile: SolvexaUser = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Solvexa Pioneer',
          username: generatedUsername,
          email: user.email || '',
          photoURL: user.photoURL || null,
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
          identityCards: [
            { id: '1', label: 'Signal Pioneer', icon: 'sensors', order: 1, category: 'role' },
          ],
        };

        try {
          await createUserProfile(user.uid, {
            displayName: newProfile.displayName,
            email: newProfile.email,
            photoURL: newProfile.photoURL,
          });
        } catch (createErr) {
          if (import.meta.env.DEV) {
            console.warn('[AuthContext] Firestore createProfile notice:', createErr);
          }
        }

        profile = newProfile;
      }

      setSolvexaUser(profile);
      dataStore.setDataMode('REAL');
      setDataModeState('REAL');
      dataStore.setCurrentUser(profile);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[AuthContext] Firestore read notice, loading authentic user profile:', error);
      }
      // Strictly construct authentic profile from the authenticated Firebase User credentials
      const authenticProfile: SolvexaUser = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Solvexa Pioneer',
        username: (user.displayName || user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_'),
        email: user.email || '',
        photoURL: user.photoURL || null,
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
        identityCards: [
          { id: '1', label: 'Signal Pioneer', icon: 'sensors', order: 1, category: 'role' },
        ],
      };
      setSolvexaUser(authenticProfile);
      dataStore.setDataMode('REAL');
      setDataModeState('REAL');
      dataStore.setCurrentUser(authenticProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await loadProfile(firebaseUser);
    } else {
      setSolvexaUser(dataStore.getCurrentUser());
    }
  }, [firebaseUser, loadProfile]);

  const signInAsGuest = useCallback((_customName?: string) => {
    setIsGuest(true);
    localStorage.setItem('solvexa_guest_mode', 'true');
    dataStore.setDataMode('DEMO');
    setDataModeState('DEMO');
    setSolvexaUser(dataStore.getCurrentUser());
    setLoading(false);
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem('solvexa_guest_mode', 'true');
    dataStore.setDataMode('DEMO');
    setDataModeState('DEMO');
    setSolvexaUser(dataStore.getCurrentUser());
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsGuest(false);
    localStorage.removeItem('solvexa_guest_mode');
    dataStore.clearUserSession();
    dataStore.setDataMode('REAL');
    setDataModeState('REAL');
    setFirebaseUser(null);
    setSolvexaUser(null);
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    localStorage.removeItem('solvexa_guest_mode');
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    dataStore.clearUserSession();
    dataStore.setDataMode('REAL');
    setDataModeState('REAL');
    setFirebaseUser(null);
    setSolvexaUser(null);
  }, []);

  useEffect(() => {
    // Listen for dataStore local changes
    const unsubStore = dataStore.subscribe(() => {
      const current = dataStore.getCurrentUser();
      if (current && current.uid !== 'user_anonymous') {
        setSolvexaUser(current);
      }
      setDataModeState(dataStore.getDataMode());
    });

    // Handle Google redirect result on app start
    getGoogleRedirectResult().catch((error) => {
      console.warn('[AuthContext] Redirect result skipped:', error);
    });

    // Subscribe to auth state changes
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);

        if (user) {
          setIsGuest(false);
          localStorage.removeItem('solvexa_guest_mode');
          await loadProfile(user);
        } else if (localStorage.getItem('solvexa_guest_mode') === 'true') {
          setIsGuest(true);
          dataStore.setDataMode('DEMO');
          setDataModeState('DEMO');
          const current = dataStore.getCurrentUser();
          setSolvexaUser(current);
        } else {
          dataStore.clearUserSession();
          setSolvexaUser(null);
        }

        setLoading(false);
      });

      return () => {
        unsubscribe();
        unsubStore();
      };
    } catch {
      if (localStorage.getItem('solvexa_guest_mode') === 'true') {
        setIsGuest(true);
        dataStore.setDataMode('DEMO');
        setDataModeState('DEMO');
        setSolvexaUser(dataStore.getCurrentUser());
      }
      setLoading(false);
      return () => unsubStore();
    }
  }, [loadProfile]);

  const isAuthenticated = !!firebaseUser || isGuest;

  const value: AuthContextValue = {
    firebaseUser,
    solvexaUser,
    loading,
    isAuthenticated,
    onboardingComplete: solvexaUser?.onboardingComplete ?? true,
    isGuest,
    dataMode,
    refreshProfile,
    signInAsGuest,
    enableDemoMode,
    exitDemoMode,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
