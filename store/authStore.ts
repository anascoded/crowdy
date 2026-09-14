import { create } from 'zustand';
import { authService } from '@/services/authService';
import { SignInPayload, SignUpPayload } from '@/types';

interface UserProfile {
    id: string;
    email: string;
    name?: string;
}

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    needsVerification: boolean;
    unverifiedEmail: string | null;

    signUp: (payload: SignUpPayload) => Promise<void>;
    confirmSignUp: (code: string) => Promise<boolean>;
    resendCode: () => Promise<boolean>;
    signIn: (payload: SignInPayload) => Promise<void>;
    signOut: () => Promise<void>;
    checkPersistedSession: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    needsVerification: false,
    unverifiedEmail: null,
    clearError: () => set({ error: null }),

    signUp: async (payload: SignUpPayload) => {
        set({ isLoading: true, error: null });
        try {
            const { nextStep } = await authService.register(payload);

            // @ts-ignore
            if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                set({ needsVerification: true, unverifiedEmail: payload.email, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.message ?? 'Registration failed', isLoading: false });
            throw err;
        }
    },

    confirmSignUp: async (code: string) => {
        set({ isLoading: true, error: null });
        const email = get().unverifiedEmail;
        if (!email) {
            set({ error: 'No unverified email session found', isLoading: false });
            return false;
        }
        try {
            const { isSignUpComplete } = await authService.confirmRegistration(email, code);
            if (isSignUpComplete) {
                set({ needsVerification: false, unverifiedEmail: null, isLoading: false });
                return true;
            }
            set({ isLoading: false });
            return false;
        } catch (err: any) {
            set({ error: err.message ?? 'Verification code invalid', isLoading: false });
            return false;
        }
    },

    // Resends the Cognito confirmation code to the email captured at sign-up
    // time (get().unverifiedEmail). Does not touch isLoading/needsVerification
    // — this is a side action on the verify screen, not a state transition —
    // so it won't interfere with the verify button's own loading state.
    resendCode: async () => {
        const email = get().unverifiedEmail;
        if (!email) {
            set({ error: 'No unverified email session found' });
            return false;
        }
        try {
            set({ error: null });
            await authService.resendCode(email);
            return true;
        } catch (err: any) {
            set({ error: err.message ?? 'Failed to resend code' });
            return false;
        }
    },

    signIn: async (payload: SignInPayload) => {
        set({ isLoading: true, error: null });
        try {
            const { user } = await authService.signIn(payload);
            set({ user: { id: user.id, email: user.email, name: user.displayName }, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({ error: err.message ?? 'Invalid credentials', isLoading: false });
            throw err;
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        try {
            await authService.signOut();
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (err) {
            set({ isLoading: false });
        }
    },

    checkPersistedSession: async () => {
        try {
            const user = await authService.me();
            set({ user: { id: user.id, email: user.email, name: user.displayName }, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
        }
    }
}));

export default useAuthStore;