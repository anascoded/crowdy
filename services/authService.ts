/*
 *
 */

import { initializeApp } from 'firebase/app';
// @ts-ignore
import {getAuth, initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification,} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SignInPayload, SignUpPayload } from '@/types';

/**
 *
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
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

/**
 * An authentication service providing methods for user sign-up, sign-in, sign-out,
 * and retrieval of the currently authenticated user's profile.
 *
 * @typedef {Object} authService
 *
 * @property {Function} signUp
 * Asynchronously registers a new user with an email and password, verifies their email,
 * and returns the newly created user object along with authentication tokens.
 *
 * @param {SignUpPayload} payload The sign-up details including email, password, and display name.
 * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>} A promise that resolves
 * with the authenticated user details and tokens.
 *
 * @property {Function} signIn
 * Asynchronously signs in an existing user with an email and password. The method ensures
 * that the user's email is verified before authentication is completed.
 *
 * @param {SignInPayload} payload The sign-in details including email and password.
 * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>} A promise that resolves
 * with the authenticated user details and tokens.
 *
 * @property {Function} signOut
 * Asynchronously signs out the currently authenticated user from the session.
 *
 * @returns {Promise<void>} A promise that resolves when the sign-out process is completed.
 *
 * @property {Function} me
 * Retrieves the profile of the currently authenticated user. Throws an error if no user
 * is authenticated in the current session.
 *
 * @returns {Promise<User>} A promise that resolves with the currently authenticated user's details.
 */
const authService = {
  signUp: async (payload: SignUpPayload) => {
    const credential = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
    );

    await sendEmailVerification(credential.user);

    /**
     * Represents a user in the system with unique identification, contact information, display name, and account creation timestamp.
     *
     * Properties:
     * - `id` (string): A unique identifier for the user.
     * - `email` (string): The email address of the user. This is a mandatory field.
     * - `displayName` (string): The display name of the user, as specified in the payload.
     * - `createdAt` (string): The ISO 8601 formatted timestamp indicating when the user was created.
     */
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
   * Handles the sign-in process for a user using their email and password.
   *
   * @param {SignInPayload} payload - The payload containing the user's email and password.
   * @throws {Error} Throws an error if the user's email has not been verified.
   * @returns {Promise<{ user: User, accessToken: string, refreshToken: string }>}
   * A promise resolving to an object containing the signed-in user's details and authentication tokens.
   */
  signIn: async (payload: SignInPayload) => {
    const credential = await signInWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
    );

    if (!credential.user.emailVerified) {
      throw new Error('Please verify your email before signing in');
    }

    /**
     * Represents a user object containing essential details of an authenticated user.
     *
     * @typedef {Object} User
     * @property {string} id - Unique identifier for the user.
     * @property {string} email - Email address of the user. Guaranteed to be non-null.
     * @property {string | undefined} displayName - Display name of the user, if available.
     * @property {string} createdAt - ISO 8601 formatted timestamp indicating when the user account was created.
     */
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
   * This function uses the Firebase authentication system
   * to log out the user from the application.
   *
   * @returns {Promise<void>} A promise that resolves when the sign-out operation is complete.
   */
  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  /**
   * Retrieves the currently authenticated user's information.
   *
   * @throws {Error} Throws an error if there is no authenticated user.
   * @returns {Promise<Object>} A promise that resolves to an object containing the user's details:
   * - id: The unique identifier of the user.
   * - email: The email address of the user.
   * - displayName: The display name of the user, or `undefined` if not available.
   * - createdAt: The ISO string representation of the account creation date.
   */
  me: async () => {
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