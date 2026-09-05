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

  /**
   * Signs out the current user.
   * If an error occurs during sign-out, it logs the error and rethrows it.
   */
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

  /**
   * Registers a new user with the provided payload. Currently not implemented.
   * @param _payload
   */
  register: async (_payload: SignUpPayload) => {
    throw new Error('Registration not implemented');
  },

  /**
   * Confirms user registration with the provided email and confirmation code. Currently not implemented.
   * @param _email
   * @param _code
   */
  confirmRegistration: async (_email: string, _code: string) => {
    throw new Error('Confirmation not implemented');
  },
};