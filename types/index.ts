// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Place ───────────────────────────────────────────────────────────────────

export interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  rating?: number;
}

// ─── Crowd ───────────────────────────────────────────────────────────────────

export type CrowdLevel = "low" | "moderate" | "busy" | "very_busy";

export interface CrowdLive {
  placeId: string;
  percentage: number; // 0–100
  level: CrowdLevel;
  updatedAt: string;
}

export interface CrowdHour {
  hour: number; // 0–23
  percentage: number; // 0–100
  level: CrowdLevel;
}

export interface CrowdDay {
  day: number; // 0 = Monday … 6 = Sunday
  date: string; // ISO date string
  hours: CrowdHour[];
}

export interface CrowdHistory {
  placeId: string;
  days: CrowdDay[]; // up to 7 days
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export interface Favorite {
  id: string;
  userId: string;
  place: Place;
  addedAt: string;
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  displayName?: string;
}
