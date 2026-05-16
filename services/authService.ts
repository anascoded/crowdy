import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { Platform } from 'react-native';
import { User, SignInPayload, SignUpPayload } from '@/types';

/**
 * Firebase Configuration
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// 1. Declare a flexible auth instance variable
let authInstance;

// 2. Use a distinct runtime platform gate to branch imports
if (Platform.OS === 'web') {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  // Dynamic runtime imports isolate mobile dependencies from the AWS web builder
  const { initializeAuth: initNativeAuth, getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  authInstance = initNativeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// 3. Export the single, resolved instance
export const auth = authInstance;

/**
 * Authentication Service Methods
 */
const authService = {
  signUp: async (payload: SignUpPayload) => {
    const credential = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
    );
    await sendEmailVerification(credential.user);
    const user: User = {
      id: credential.user.uid,
      email: credential.user.email!,
      displayName: payload.displayName,
      createdAt: new Date().toISOString(),
    };
    const token = await credential.user.getIdToken();
    return { user, accessToken: token, refreshToken: token };
  },

  signIn: async (payload: SignInPayload): Promise<{ user: User; accessToken: string; refreshToken: string; }> => {
    const credential = await signInWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
    );
    if (!credential.user.emailVerified) {
      throw new Error('Please verify your email before signing in');
    }
    const user: User = {
      id: credential.user.uid,
      email: credential.user.email!,
      displayName: credential.user.displayName ?? undefined,
      createdAt: new Date(credential.user.metadata.creationTime!).toISOString(),
    };
    const token = await credential.user.getIdToken();
    return { user, accessToken: token, refreshToken: token };
  },

  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  me: async (): Promise<object> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return {
      id: user.uid,
      email: user.email!,
      displayName: user.displayName ?? undefined,
      createdAt: new Date(user.metadata.creationTime!).toISOString(),
    };
  },
};

export { authService };