export const colors = {
  // Primary
  primary: "#814141",
  primaryLight: "#EDE9FE",
  primaryDark: "#4A0404",

  // Neutrals
  black: "#1A1A2E",
  gray900: "#111827",
  gray800: "#1F2937",
  gray700: "#374151",
  gray600: "#4B5563",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray300: "#D1D5DB",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  white: "#FFFFFF",

  // Semantic
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Crowd levels
  crowdLow: "#10B981",
  crowdModerate: "#F59E0B",
  crowdBusy: "#F97316",
  crowdVeryBusy: "#EF4444",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  fontFamily: {
    regular: "System",
    bold: "System",
  },
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 15,
    xl: 16,
    "2xl": 18,
    "3xl": 20,
    "4xl": 24,
    "5xl": 28,
    "6xl": 32,
  },
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
