import { clearTokens, saveTokens } from "@/lib/api";
import { SignInPayload, SignUpPayload, User } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Represents the state and actions related to user authentication.
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

/**
 * State management store for authentication, providing methods and state
 * to handle user authentication processes such as sign in, sign up, and sign out.
 *
 * @typedef {Object} AuthState
 *
 * @property {?User} user
 * Represents the currently authenticated user. Null if no user is authenticated.
 *
 * @property {boolean} isAuthenticated
 * Indicates if a user is currently authenticated.
 *
 * @property {boolean} isLoading
 * Represents whether an authentication-related operation (e.g., sign in, sign up, or sign out) is in progress.
 *
 * @property {?string} error
 * Holds an error message if an authentication-related operation fails. Null otherwise.
 *
 * @method signIn
 * Asynchronously signs a user in based on the provided credentials, updates the store state with the authenticated user,
 * and stores tokens securely.
 * Throws an error if the operation fails.
 *
 * @param {SignInPayload} payload
 * An object containing the necessary credentials for signing in.
 *
 * @method signUp
 * Asynchronously registers a new user based on the provided information, updates the store state with the authenticated user,
 * and stores tokens securely.
 * Throws an error if the operation fails.
 *
 * @param {SignUpPayload} payload
 * An object containing the necessary details for registering a new user.
 *
 * @method signOut
 * Asynchronously signs the user out, clears stored tokens, and resets the store state to reflect that no user is authenticated.
 *
 * @method clearError
 * Clears the current error message from the store state.
 *
 * @method setUser
 * Sets the provided user as the currently authenticated user and updates the store state accordingly.
 *
 * @param {User} user
 * An object representing the authenticated user.
 *
 * @property {Object} persistConfig
 * Configuration for persisting the state using local storage.
 *
 *   - name: Name of the storage key ("auth-storage").
 *   - storage: Storage implementation used for persisting the state.
 *   - partialize: Function defining which state properties should be persisted.
 */
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Sign in ────────────────────────────────────────────────────────────
      signIn: async (payload: SignInPayload) => {
        set({ isLoading: true, error: null });
        try {
          const { authService } = await import("@/services/authService");
          const { user, accessToken, refreshToken } =
            await authService.signIn(payload);

          await saveTokens(accessToken, refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ error: err.message ?? "Sign in failed", isLoading: false });
          throw err;
        }
      },

      // ── Sign up ────────────────────────────────────────────────────────────
      signUp: async (payload: SignUpPayload) => {
        set({ isLoading: true, error: null });
        try {
          const { authService } = await import("@/services/authService");
          const { user, accessToken, refreshToken } =
            await authService.signUp(payload);

          await saveTokens(accessToken, refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ error: err.message ?? "Sign up failed", isLoading: false });
          throw err;
        }
      },

        // ── Update Profile ───────────────────────────────────────────────────────────
        updateProfile: async (updates: { displayName?: string }) => {
            // Update Firebase user profile
            // Implementation depends on your auth setup
        },

        // ── Update Password ───────────────────────────────────────────────────────────
        updatePassword: async (currentPassword: string, newPassword: string) => {
            // Update Firebase password
            // Implementation depends on your auth setup
        },
      // ── Sign out ───────────────────────────────────────────────────────────
      signOut: async () => {
        set({ isLoading: true });
        try {
          const { authService } = await import("@/services/authService");
          await authService.signOut();
        } catch {
          // Continue sign out even if the API call fails
        } finally {
          await clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // ── Helpers ────────────────────────────────────────────────────────────
      clearError: () => set({ error: null }),
      setUser: (user: User) => set({ user, isAuthenticated: true }),
    }),

    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user — tokens live in SecureStore via lib/api.ts
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
