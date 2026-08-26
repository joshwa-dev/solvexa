import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { connectToEmulators } from './services/firebase/emulator';
import './index.css';

// Connect to Firebase Emulators in development if enabled
connectToEmulators();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
