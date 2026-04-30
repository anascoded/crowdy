import { CrowdLevel, CrowdLive } from "@/types";
import { StyleSheet, Text, View } from "react-native";

interface CrowdMeterProps {
  crowd: CrowdLive;
  showLabel?: boolean;
}

interface LevelConfig {
  color: string;
  background: string;
  label: string;
  emoji: string;
}

const LEVEL_CONFIG: Record<CrowdLevel, LevelConfig> = {
  low: {
    color: "#10B981",
    background: "#D1FAE5",
    label: "Not busy",
    emoji: "🟢",
  },
  moderate: {
    color: "#F59E0B",
    background: "#FEF3C7",
    label: "Moderately busy",
    emoji: "🟡",
  },
  busy: {
    color: "#F97316",
    background: "#FFEDD5",
    label: "Busy",
    emoji: "🟠",
  },
  very_busy: {
    color: "#EF4444",
    background: "#FEE2E2",
    label: "Very busy",
    emoji: "🔴",
  },
};

export default function CrowdMeter({
  crowd,
  showLabel = true,
}: CrowdMeterProps) {
  const config = LEVEL_CONFIG[crowd.level];

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: config.background }]}>
          <Text style={styles.badgeEmoji}>{config.emoji}</Text>
          <Text style={[styles.badgeLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Text style={styles.percentage}>{crowd.percentage}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${crowd.percentage}%` as any,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>

      {/* Scale labels */}
      {showLabel && (
        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Empty</Text>
          <Text style={styles.scaleLabel}>Moderate</Text>
          <Text style={styles.scaleLabel}>Full</Text>
        </View>
      )}

      {/* Last updated */}
      <Text style={styles.updatedAt}>
        Updated {formatUpdatedAt(crowd.updatedAt)}
      </Text>
    </View>
  );
}

function formatUpdatedAt(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  percentage: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  barBackground: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scaleLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  updatedAt: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
  },
});
