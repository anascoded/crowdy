import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

// @ts-ignore - Necessary for TypeScript environments with older module resolution
import { getReactNativePersistence } from 'firebase/auth/react-native';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Exports
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage)
});

/**
 * An authentication service providing methods for user sign-up, sign-in, sign-out,
 * and retrieval of the currently authenticated user's profile.
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

  /**
   * Authenticates a user using their email and password.
   * Verifies if the user's email is confirmed before granting access.
   *
   * @param {SignInPayload} payload - The payload containing email and password for authentication.
   * @return {Promise<{ user: User, accessToken: string, refreshToken: string }>}
   * Resolves to an object containing the authenticated user details, an access token, and a refresh token.
   *
   * @throws {Error} Throws an error if the user's email is not verified.
   */
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

  /**
   * Signs out the currently authenticated user.
   *
   * This function uses the Firebase authentication service to log out the user.
   * It ensures the user's session is terminated and their authentication state is cleared.
   *
   * @returns {Promise<void>} A promise that resolves when the user is successfully signed out.
   */
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