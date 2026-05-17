// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a.model({
    id: a.id().required(),
    name: a.string().required(),
    email: a.string().required(),
    location: a.string(),
    createdAt: a.datetime(),
    // Links down to the child entries using 'userProfileId' as the lookup key
    favorites: a.hasMany('FavoritePlace', 'userProfileId'),
    activities: a.hasMany('RecentActivity', 'userProfileId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  FavoritePlace: a.model({
    id: a.id(),
    userProfileId: a.id().required(), // The matching reference key
    // Completes the two-way relationship graph explicitly
    userProfile: a.belongsTo('UserProfile', 'userProfileId'),

    placeName: a.string().required(),
    googlePlaceId: a.string().required(),
    category: a.string().required(),
    city: a.string(),
    addedAt: a.datetime(),
  }).authorization((allow) => [allow.publicApiKey()]),

  RecentActivity: a.model({
    id: a.id(),
    userProfileId: a.id().required(), // The matching reference key
    // Completes the two-way relationship graph explicitly
    userProfile: a.belongsTo('UserProfile', 'userProfileId'),

    action: a.string().required(),
    placeName: a.string().required(),
    timestamp: a.datetime().required(),
  }).authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 365 }
  }
});