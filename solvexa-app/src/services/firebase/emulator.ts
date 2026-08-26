import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
// NOTE: Storage emulator intentionally removed — project uses Spark (free) plan.
// Media uploads use Cloudinary instead.
import { auth, db } from './config';

let emulatorsConnected = false;

export function connectToEmulators(): void {
  if (emulatorsConnected) return;
  
  if (import.meta.env.VITE_USE_EMULATOR !== 'true') return;

  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: false });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    emulatorsConnected = true;
    console.info('[Solvexa] Connected to Firebase Emulator Suite (Auth + Firestore only)');
  } catch (error) {
    console.warn('[Solvexa] Could not connect to emulators:', error);
  }
}

