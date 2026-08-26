import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import { AppRouter } from './router';
import '../styles/globals.css';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="dark">
            <AppRouter />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
