import { clearTokens, saveTokens } from "@/lib/api";
import { SignInPayload, SignUpPayload, User } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    updateProfile as updateFirebaseProfile,
    updatePassword as updateUserPassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'firebase/auth';
import { authService, auth } from "@/services/authService";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    signIn: (payload: SignInPayload) => Promise<void>;
    signUp: (payload: SignUpPayload) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: { displayName?: string }) => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    clearError: () => void;
    setUser: (user: User) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // ── Sign in ────────────────────────────────────────────────────────────
            signIn: async (payload: SignInPayload) => {
                set({ isLoading: true, error: null });
                try {
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
                try {
                    set({ isLoading: true, error: null });

                    const currentUser = get().user;
                    if (!currentUser) throw new Error('No user logged in');

                    // Get fresh user data
                    const freshUser = await authService.me() as User;

                    // Update Firebase profile
                    const firebaseUser = auth.currentUser;
                    if (firebaseUser && updates.displayName) {
                        await updateFirebaseProfile(firebaseUser, {
                            displayName: updates.displayName
                        });
                    }

                    // Update store with new profile
                    set({
                        user: {
                            ...freshUser,
                            displayName: updates.displayName || freshUser.displayName
                        },
                        isLoading: false,
                        error: null
                    });
                } catch (err: any) {
                    const errorMessage = err.message ?? 'Failed to update profile';
                    set({ error: errorMessage, isLoading: false });
                    throw err;
                }
            },

            // ── Update Password ───────────────────────────────────────────────────────────
            updatePassword: async (currentPassword: string, newPassword: string) => {
                try {
                    set({ isLoading: true, error: null });

                    const user = get().user;
                    if (!user) throw new Error('No user logged in');

                    const firebaseUser = auth.currentUser;
                    if (!firebaseUser || !firebaseUser.email) {
                        throw new Error('No Firebase user');
                    }

                    // Re-authenticate with current password
                    const credential = EmailAuthProvider.credential(
                        firebaseUser.email,
                        currentPassword
                    );
                    await reauthenticateWithCredential(firebaseUser, credential);

                    // Update password
                    await updateUserPassword(firebaseUser, newPassword);

                    set({ isLoading: false, error: null });
                } catch (err: any) {
                    if (err.code === 'auth/wrong-password') {
                        set({ error: 'Current password is incorrect', isLoading: false });
                        throw new Error('Current password is incorrect');
                    }
                    const errorMessage = err.message ?? 'Failed to update password';
                    set({ error: errorMessage, isLoading: false });
                    throw err;
                }
            },

            // ── Sign out ───────────────────────────────────────────────────────────
            signOut: async () => {
                set({ isLoading: true });
                try {
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
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);

export default useAuthStore;