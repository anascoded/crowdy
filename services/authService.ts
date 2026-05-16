import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { Platform } from 'react-native';
import { User, SignInPayload, SignUpPayload } from '@/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Keep a cached instance so we only initialize Firebase Auth once
let cachedAuth: any = null;

export const auth = {
  get currentUser() {
    if (!cachedAuth) {
      if (Platform.OS === 'web') {
        cachedAuth = initializeAuth(app, { persistence: browserLocalPersistence });
      } else {
        const { initializeAuth: initNativeAuth, getReactNativePersistence } = require('firebase/auth');
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        cachedAuth = initNativeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
      }
    }
    return cachedAuth.currentUser;
  },
  // Forward methods required by authService
  getInternalInstance() {
    if (!cachedAuth) {
      if (Platform.OS === 'web') {
        cachedAuth = initializeAuth(app, { persistence: browserLocalPersistence });
      } else {
        const { initializeAuth: initNativeAuth, getReactNativePersistence } = require('firebase/auth');
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        cachedAuth = initNativeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
      }
    }
    return cachedAuth;
  }
};

/**
 * Authentication Service Methods
 */
const authService = {
  signUp: async (payload: SignUpPayload) => {
    const credential = await createUserWithEmailAndPassword(
        auth.getInternalInstance(), // <-- Pass the internal instance
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
        auth.getInternalInstance(), // <-- Pass the internal instance
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
    await firebaseSignOut(auth.getInternalInstance());
  },

  me: async (): Promise<object> => {
    const user = auth.currentUser; // Uses getter property safely
    if (!user) throw new Error('Not authenticated');
    // Using default standard metadata values safely
    return {
      id: user.uid,
      email: user.email!,
      displayName: user.displayName ?? undefined,
      createdAt: new Date().toISOString(),
    };
  },
};

export { authService };