import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Requires authentication. If not authenticated, redirects to /login.
 * If authenticated but onboarding not complete, redirects to /onboarding.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, onboardingComplete, solvexaUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7a00ff] to-[#0066ff] 
                          animate-pulse flex items-center justify-center signal-glow">
            <span className="material-symbols-outlined text-white text-xl icon-filled">sensors</span>
          </div>
          <p className="text-on-surface-variant text-metadata-sm font-medium tracking-widest uppercase">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If profile exists but onboarding is incomplete, go to onboarding
  if (solvexaUser && !onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

/**
 * Redirects authenticated users away from auth pages.
 */
export function PublicOnlyRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, onboardingComplete } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7a00ff] to-[#0066ff] 
                        animate-pulse signal-glow" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={onboardingComplete ? '/pulse' : '/onboarding'} replace />;
  }

  return <>{children}</>;
}
