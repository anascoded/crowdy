import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
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

// @ts-ignore
// @ts-ignore
// @ts-ignore
export const authService = {
  signIn: async (payload: SignInPayload) => {
    try {
      console.log('Attempting sign in for:', payload.email);

      // @ts-ignore
      const output = await signIn({
        username: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
        },
      });

      console.log('Sign in successful');

      // Don't fetch additional attributes - just return basic user info
      const user: User = {
        id: payload.email, // Use email as ID for now
        email: payload.email,
        displayName: 'User',
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
        displayName: attributes.preferred_username ?? 'User',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error('Not authenticated');
    }
  },

  register: async (_payload: SignUpPayload) => {
    throw new Error('Registration not implemented');
  },

  confirmRegistration: async (_email: string, _code: string) => {
    throw new Error('Confirmation not implemented');
  },
};