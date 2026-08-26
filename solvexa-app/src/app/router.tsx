import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SideNav } from '../components/navigation/SideNav';
import { TopBar } from '../components/navigation/TopBar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { ProtectedRoute, PublicOnlyRoute } from '../routes/ProtectedRoute';

// Lazy-loaded pages
const LandingPage = lazy(() => import('../features/auth/LandingPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const SignupPage = lazy(() => import('../features/auth/SignupPage'));
const OnboardingPage = lazy(() => import('../features/auth/OnboardingPage'));
const PulsePage = lazy(() => import('../features/feed/PulsePage'));
const ExplorePage = lazy(() => import('../features/search/ExplorePage'));
const SignalsPage = lazy(() => import('../features/signals/SignalsPage'));
const MomentsPage = lazy(() => import('../features/moments/MomentsPage'));
const SpacesPage = lazy(() => import('../features/spaces/SpacesPage'));
const SpaceDetailPage = lazy(() => import('../features/spaces/SpaceDetailPage'));
const ProfilePage = lazy(() => import('../features/profiles/ProfilePage'));
const MessagesPage = lazy(() => import('../features/messages/MessagesPage'));
const ConversationPage = lazy(() => import('../features/messages/ConversationPage'));
const NotificationsPage = lazy(() => import('../features/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('../features/auth/SettingsPage'));
const SavedPage = lazy(() => import('../features/posts/SavedPage'));
const CreatePage = lazy(() => import('../features/posts/CreatePage'));
const PostDetailPage = lazy(() => import('../features/posts/PostDetailPage'));
const SignalDetailPage = lazy(() => import('../features/signals/SignalDetailPage'));
const OrbitPage = lazy(() => import('../features/profiles/OrbitPage'));
const SignalMapPage = lazy(() => import('../features/signals/SignalMapPage'));
const NotFoundPage = lazy(() => import('./NotFoundPage'));

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center signal-glow"
          style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}
        >
          <span className="material-symbols-outlined text-white text-xl icon-filled">
            sensors
          </span>
        </div>
        <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-[0.1em]">
          Solvexa
        </p>
      </div>
    </div>
  );
}

/** Layout wrapper for authenticated app pages */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#0A0A0B] flex flex-col md:flex-row">
      <SideNav />
      <TopBar />
      <MobileBottomNav />
      <main className="flex-1 min-w-0 w-full md:ml-64 md:pt-16 pb-20 md:pb-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

/** Layout wrapper for full-screen pages (signals video, moments) */
function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-black flex flex-col md:flex-row">
      <SideNav />
      <MobileBottomNav />
      <main className="flex-1 min-w-0 w-full md:ml-64 pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
        
        {/* Onboarding (protected but separate from main layout) */}
        <Route
          path="/onboarding"
          element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>}
        />

        {/* Main app — authenticated pages */}
        <Route
          path="/pulse"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><PulsePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><ExplorePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/moments"
          element={
            <ProtectedRoute>
              <ImmersiveLayout><MomentsPage /></ImmersiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/signals"
          element={
            <ProtectedRoute>
              <ImmersiveLayout><SignalsPage /></ImmersiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/signal/:signalId"
          element={
            <ProtectedRoute>
              <ImmersiveLayout><SignalDetailPage /></ImmersiveLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spaces"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><SpacesPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spaces/:spaceId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><SpaceDetailPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/post/:postId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><PostDetailPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        {/* Nexus = user's own profile */}
        <Route
          path="/nexus"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><MessagesPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><ConversationPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><NotificationsPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><SettingsPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved/*"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><SavedPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/*"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><CreatePage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orbit"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><OrbitPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/signal-map"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout><SignalMapPage /></AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
