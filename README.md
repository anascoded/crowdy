# Crowdy - Live Crowd Meter App

A React Native mobile application that shows real-time crowd levels for venues and places, helping users find the perfect time to visit their favorite locations.

## 🎯 Overview

Crowdy is a crowd intelligence app that displays live busyness levels and 7-day historical crowd data for thousands of venues. Users can search for places, save favorites, and make informed decisions about when to visit based on crowd patterns.

**Live Features:**
- Real-time crowd data powered by Google Popular Times & Outscraper API
- 7-day hourly crowd history with animated charts
- Favorite places management with cloud sync
- Nearby venues discovery with device location
- Activity tracking and dashboard
- User authentication via AWS Cognito
- Best time to visit recommendations

## 📱 Tech Stack

### Frontend
- **React Native** with Expo Router (file-based routing)
- **TypeScript** for type safety
- **Zustand** for state management
- **React Query** for data fetching
- **Expo** for cross-platform builds (iOS, Android, Web)

### Backend & Services
- **AWS Cognito** - User authentication (USER_PASSWORD_AUTH flow)
- **AWS AppSync** - GraphQL API with real-time subscriptions
- **AWS Amplify v6** - Backend configuration & deployment
- **Google Places API** - Venue search & autocomplete
- **Outscraper API** - Real crowd data via async polling

### Native APIs
- **expo-location** - Device location services
- **expo-secure-store** - Secure credential storage (Remember Me)
- **AsyncStorage** - Local favorites & activity persistence
- **expo-font** - Custom font loading

## ✨ Features

### Core Features
✅ **Live Crowd Meters** - See current busyness percentage with visual indicators (Not Busy, Moderate, Busy, Very Busy)
✅ **7-Day History Charts** - Hourly crowd patterns with smooth animations
✅ **Best Time to Visit** - AI-powered recommendations for the least crowded times
✅ **Favorites Management** - Save & organize your favorite places by category
✅ **Real Activity Feed** - Track your favorite additions/removals in real-time
✅ **Nearby Discovery** - Find venues based on your current location
✅ **User Authentication** - Secure sign-up/sign-in with AWS Cognito
✅ **Remember Me** - Securely store credentials with expo-secure-store
✅ **Profile Management** - Edit profile, change password, manage settings
✅ **Location Settings** - Auto-detect or manually set your home city
✅ **Dark/Light Mode** - Automatic theme switching based on device preference
✅ **Events Nearby** - Discover events happening in your area

### Advanced Features
- 🔄 Real-time synchronization via AWS AppSync
- 📊 Historical data visualization with react-native-svg
- 🎨 Beautiful UI with Ionicons & custom styling
- 🔐 Secure authentication with custom auth flow
- 📍 Geolocation-based search & filtering
- ⚡ Optimized data fetching with React Query

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm 9+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ (macOS required)
- Android: Android Studio with SDK 33+
- AWS account with Amplify configured

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/crowdy.git
cd crowdy
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Update `.env.local` with your API keys:
```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_key
EXPO_PUBLIC_OUTSCRAPER_API_KEY=your_outscraper_key
```

4. **Verify Amplify configuration**
Ensure `amplify_outputs.json` exists in the root with your AWS credentials.

5. **Start the development server**
```bash
npx expo start --clear
```

Press:
- `i` for iOS (simulator)
- `a` for Android (emulator)
- `w` for web
- `r` to reload

## 📁 Project Structure

```
crowdy/
├── app/
│   ├── (auth)/                    # Authentication screens (sign-in, sign-up, forgot-password)
│   ├── (tabs)/                    # Main tab navigation (home, explore, favorites, profile)
│   │   ├── home.tsx              # Dashboard with stats & activity feed
│   │   ├── explore.tsx           # Search & nearby places discovery
│   │   ├── favorites.tsx         # Saved places with category filter
│   │   ├── events.tsx            # Nearby events (nested route)
│   │   ├── profile-settings/     # User settings & preferences
│   │   └── _layout.tsx           # Tab bar configuration
│   ├── place/[id].tsx            # Place detail screen with crowd data
│   ├── screens/
│   │   ├── about.tsx             # About & social links
│   │   └── events.tsx            # Events placeholder
│   └── _layout.tsx               # Root layout with Amplify config
│
├── components/
│   ├── CrowdMeter.tsx            # Live crowd indicator component
│   ├── CrowdHistoryChart.tsx     # 7-day chart with animations
│   ├── PlaceCard.tsx             # Reusable place card component
│   └── EmptyStateFavorites.tsx   # SVG illustration for empty favorites
│
├── services/
│   ├── authService.ts            # AWS Cognito authentication
│   ├── placesService.ts          # Google Places API integration
│   ├── crowdService.ts           # Outscraper crowd data fetching
│   └── favoritesService.ts       # Favorites API calls
│
├── store/
│   ├── authStore.ts              # Zustand auth state
│   ├── placesStore.ts            # Places state
│   ├── favoritesStore.ts         # Favorites state with AsyncStorage
│   └── themeStore.ts             # Dark/light mode state
│
├── hooks/
│   ├── useCrowdLive.ts           # Hook for live crowd data
│   └── useCrowdHistory.ts        # Hook for historical crowd data
│
├── lib/
│   ├── api.ts                    # Axios instance & interceptors
│   └── queryClient.ts            # React Query configuration
│
├── utils/
│   ├── index.ts                  # Helper functions
│   └── geocoding.ts              # Location geocoding utilities
│
├── types/
│   └── index.ts                  # TypeScript interfaces & types
│
├── assets/
│   ├── icons/                    # App icons (iOS, Android, Web, Splash)
│   └── images/                   # Other images & illustrations
│
├── amplify_outputs.json          # AWS Amplify configuration (committed)
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── babel.config.js               # Babel configuration (no worklets)
├── tsconfig.json                 # TypeScript configuration
├── .env.local                    # Environment variables (gitignored)
└── README.md                     # This file
```

## 🔐 Authentication

### AWS Cognito Setup
- **User Pool ID:** `us-east-2_3bfaUO3G3`
- **Client ID:** `8gvkunbuu3a8ulqi8u3tuja1t`
- **Auth Flow:** USER_PASSWORD_AUTH (critical for React Native)
- **MFA:** Disabled
- **Password Policy:** Min 8 chars, uppercase, lowercase, numbers, symbols

### Authentication Flow
1. User signs up → email verification
2. Sign in with credentials → session stored in SecureStore
3. Remember Me option saves credentials securely
4. Automatic session refresh via Cognito tokens
5. Sign out clears all stored credentials

## 📡 API Integration

### Google Places API
- **Endpoint:** `places-backend.googleapis.com` (Legacy)
- **Features:** Search, autocomplete, place details, ratings
- **Rate Limit:** 1,000 requests/day (free tier)

### Outscraper API
- **Endpoint:** `https://api.outscraper.com/v3`
- **Features:** Real crowd data from Google Popular Times
- **Polling:** Async requests with 30-second intervals
- **Rate Limit:** Depends on plan

### AWS AppSync GraphQL
- **Endpoint:** `https://uess6pit75gwnfbk4uvv2gxlqi.appsync-api.us-east-2.amazonaws.com/graphql`
- **Models:** UserProfile, FavoritePlace, RecentActivity
- **Auth:** AMAZON_COGNITO_USER_POOLS + API_KEY
- **Operations:** Create, Read, Update, Delete

## 🎨 UI/UX Features

### Design System
- **Primary Color:** #CA3519 (burnt orange)
- **Secondary Color:** #FAD341 (bright yellow)
- **Success Color:** #31C950 (green)
- **Warning Color:** #F59E0B (amber)
- **Error Color:** #EF4444 (red)
- **Background:** #F9FAFB (light gray)

### Icons
- **Tab Navigation:** Ionicons from `@expo/vector-icons`
- **Icon Library:** Ionicons throughout (no Lucide)

### Animations
- Blinking current hour on crowd history charts
- Smooth crowd meter transitions
- Layout animations on favorites filter toggle
- Custom chart animations with react-native-svg

## 🚢 Deployment

### EAS Build (Recommended)

**iOS Build:**
```bash
eas build --platform ios
eas submit --platform ios
```

**Android Build:**
```bash
eas build --platform android
eas submit --platform android
```

### Prerequisites for EAS
- Amplify outputs configured (`amplify_outputs.json` committed)
- EAS project ID in `eas.json`
- Valid Apple/Google developer accounts

### Environment Setup
```bash
eas login
eas build --platform ios --profile preview
```

### Troubleshooting EAS Builds
- **Build fails:** Clear cache: `eas build --platform android --profile preview --clear-cache`
- **Module not found:** Verify `amplify_outputs.json` is in root
- **Icon issues:** Ensure icons are 1024x1024 PNG with proper formats

## 🔧 Configuration Files

### `app.json`
- App metadata (name, version, bundle ID)
- Platform-specific configurations
- Icon & splash screen paths
- EAS project ID
- Plugins & experiments

### `amplify_outputs.json`
- AWS Cognito user pool & client config
- AppSync GraphQL endpoint & API key
- Auth rules & authorization types
- Must be committed to git for EAS builds

### `.env.local`
- Google Places API key
- Outscraper API key
- Not committed to version control

### `eas.json`
- Build profiles (preview, production)
- Submission configurations
- Platform-specific settings

## 📊 Data Models

### UserProfile
```graphql
{
  id: ID!
  name: String!
  email: String!
  location: String
  favorites: [FavoritePlace]
  activities: [RecentActivity]
  createdAt: AWSDateTime
}
```

### FavoritePlace
```graphql
{
  id: ID!
  userProfileId: ID!
  placeName: String!
  googlePlaceId: String!
  category: String!
  city: String
  addedAt: AWSDateTime
}
```

### RecentActivity
```graphql
{
  id: ID!
  userProfileId: ID!
  action: String! (favorite_added, favorite_removed, place_visited)
  placeName: String!
  timestamp: AWSDateTime!
}
```

## 🎯 Key Implementation Details

### Remember Me
- Credentials stored in `expo-secure-store` (encrypted)
- Auto-loaded on app launch
- User can clear with sign-out

### Activity Tracking
- Logged to AsyncStorage (`crowdy_activities` key)
- Synced to AppSync on authenticated requests
- Limited to 10 most recent activities

### Favorites Sync
- Local AsyncStorage as primary storage
- Cloud sync via AWS AppSync (planned)
- Category filtering with fixed position tab

### Crowd Data
- Live data from Outscraper API (async polling)
- Historical data stored in DynamoDB via AppSync
- Best time calculation based on future hours

## 🐛 Common Issues & Solutions

### Issue: "No development build installed"
**Solution:** Run `expo run:android` or `expo run:ios`

### Issue: "Module not found: expo-google-fonts"
**Solution:** Remove Poppins font (no custom fonts needed)

### Issue: "UserAlreadyAuthenticatedException"
**Solution:** Call `signOut()` before `signIn()` in authService

### Issue: "Cannot find module amplify_outputs.json"
**Solution:** Ensure file is in project root and committed to git

### Issue: Splash screen shows indefinitely
**Solution:** Check `SplashScreen.hideAsync()` is called in `_layout.tsx`

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [AWS Amplify Docs](https://docs.amplify.aws)
- [React Native Docs](https://reactnative.dev)
- [React Query Docs](https://tanstack.com/query)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Google Places API](https://developers.google.com/maps/documentation/places)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Crowdy Development Team**
- GitHub: [@crowdyapp](https://github.com/crowdyapp)
- Email: support@crowdy.app
- Website: [www.crowdy.app](https://www.crowdy.app)

## 🙏 Acknowledgments

- Google for Places API
- Outscraper for crowd data
- AWS for infrastructure
- Expo community for tools & support
- All contributors who helped make Crowdy possible

---

**Last Updated:** May 31, 2026
**App Version:** 1.0.0
**Status:** In Development
