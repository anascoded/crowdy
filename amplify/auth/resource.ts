import { defineAuth } from '@aws-amplify/backend';

/**
 * Defines the Cognito Authentication resource for Crowdy.
 * Simplifies schema validation definitions to ensure robust cross-platform SRP handshakes.
 */
export const auth = defineAuth({
  loginWith: {
    email: true, // Primary sign-in configuration alias key
  },
  //  Removing userAttributes entirely forces Cognito to use the clean standard profile path,
  // preventing the cross-platform client validation failures.
});