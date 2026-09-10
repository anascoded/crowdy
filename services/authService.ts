import { Amplify } from 'aws-amplify';
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import amplifyconfig from '@/amplify_outputs.json';
import { User, SignInPayload, SignUpPayload } from '@/types';

console.log('Amplify config loaded');

// Merge config with auth overrides
const customConfig = {
  ...amplifyconfig,
  Auth: {
    ...amplifyconfig.auth,
    Cognito: {
      ...amplifyconfig.auth,
      mfaConfiguration: 'NONE',
      authenticationFlowType: 'USER_PASSWORD_AUTH',
    },
  },
};

Amplify.configure(customConfig);
console.log('Amplify configured');

export const authService = {
  signIn: async (payload: SignInPayload) => {
    try {
      console.log('Attempting sign in for:', payload.email);

      await signIn({
        username: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
        },
      });

      console.log('Sign in successful');

      // Fetch the real Cognito attributes instead of hardcoding a placeholder
      // name — profile-settings writes to the "name" attribute, so that's
      // the one we read back here too.
      let displayName = 'User';
      let userId = payload.email;
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        userId = currentUser.userId;
        displayName = attributes.name ?? 'User';
      } catch (attrError) {
        // Sign-in itself succeeded even if attribute fetch fails for some
        // reason — fall back to the placeholder rather than failing sign-in.
        console.error('Failed to fetch user attributes after sign in:', attrError);
      }

      const user: User = {
        id: userId,
        email: payload.email,
        displayName,
        createdAt: new Date().toISOString(),
      };

      return { user, accessToken: '', refreshToken: '' };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  me: async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      return {
        id: user.userId,
        email: attributes.email ?? '',
        // Was reading attributes.preferred_username, an attribute this app
        // never writes to. profile-settings writes to "name" — read that
        // instead so an edited display name actually persists across
        // sign-outs/app restarts.
        displayName: attributes.name ?? 'User',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error('Not authenticated');
    }
  },

  register: async (payload: SignUpPayload) => {
    try {
      const email = payload.email.trim().toLowerCase();

      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password: payload.password,
        options: {
          userAttributes: {
            email,
            // Writing to "name" for consistency with signIn()/me() above and
            // with profile-settings' edit-profile screen, which also reads/
            // writes "name" — not "displayName" or "preferred_username".
            name: payload.displayName?.trim() || email.split('@')[0],
          },
        },
      });

      return { isSignUpComplete, nextStep };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  confirmRegistration: async (email: string, code: string) => {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
      });

      return { isSignUpComplete, nextStep };
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  },
};