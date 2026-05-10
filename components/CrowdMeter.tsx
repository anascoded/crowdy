import { CrowdLevel, CrowdLive } from "@/types";
import { StyleSheet, Text, View } from "react-native";
import {JSX} from "react";

/**
 * Represents the properties for the CrowdMeter component.
 *
 * The `CrowdMeterProps` interface defines the data required to render the CrowdMeter component,
 * which includes information about the live crowd and an optional label display.
 *
 * @property crowd - The live crowd data used by the component, typically containing details related
 *                   to the crowd or audience metrics.
 * @property showLabel - An optional boolean flag indicating whether to display a label
 *                       alongside the crowd meter. Defaults to `false` if not provided.
 */
interface CrowdMeterProps {
  crowd: CrowdLive;
  showLabel?: boolean;
}

/**
 * Represents the configuration for a level, providing details such as color, background, label, and emoji.
 *
 * @interface LevelConfig
 *
 * @property {string} color - The hex code or name representing the primary color for the level.
 * @property {string} background - The hex code or name representing the background color for the level.
 * @property {string} label - A descriptive label or name for the level.
 * @property {string} emoji - A single emoji representing or symbolizing the level.
 */
interface LevelConfig {
  color: string;
  background: string;
  label: string;
  emoji: string;
}

/**
 * Configuration object defining the visual and descriptive properties for different crowd levels.
 *
 * The `LEVEL_CONFIG` object is a mapping of defined crowd levels to their respective properties,
 * which include color schemes, labels, and emoji representations.
 *
 * Each key in this record represents a specific crowd level, and the associated value specifies
 * the visual and descriptive configuration details for that level.
 *
 * Properties:
 * - `low`: Represents a low crowd level with assigned properties such as color, background, label, and emoji.
 * - `moderate`: Represents a moderately busy level with corresponding visual and descriptive details.
 * - `busy`: Represents a busy crowd level with appropriate styling and descriptive attributes.
 * - `very_busy`: Represents a very busy level with corresponding configurations.
 *
 * Types:
 * - `CrowdLevel`: Enum or string union type defining possible crowd level identifiers (`low`, `moderate`, `busy`, `very_busy`).
 * - `LevelConfig`: Type defining the structure of crowd level configuration, including properties like `color`, `background`, `label`, and `emoji`.
 */
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

/**
 * Renders the `CrowdMeter` component to display information about crowd status and activity levels.
 *
 * @param {Object} props - The properties for the CrowdMeter component.
 * @param {Object} props.crowd - An object containing information about the crowd status.
 * @param {boolean} props.crowd.closed - Indicates whether the location is currently closed.
 * @param {number} props.crowd.percentage - A numeric value representing the crowd percentage.
 * @param {string} props.crowd.level - The current crowd level corresponding to a predefined configuration.
 * @param {Date|string} props.crowd.updatedAt - The date or timestamp of the last update.
 * @param {boolean} [props.showLabel=true] - Determines whether to show the scale labels below the progress bar.
 *
 * @return {JSX.Element} A JSX element representing the visual status of the crowd level, including badges, progress bars, and dynamic labels.
 */
export default function CrowdMeter({
                                     crowd,
                                     showLabel = true,
                                   }: CrowdMeterProps): JSX.Element {
  // Handle closed state
  // Handle closed state
  if (crowd.closed) {
    return (
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: "#F3F4F6" }]}>
              <Text style={styles.badgeEmoji}>🔒</Text>
              <Text style={[styles.badgeLabel, { color: "#9CA3AF" }]}>
                Closed
              </Text>
            </View>
            <Text style={styles.percentage}>—</Text>
          </View>

          <View style={styles.barBackground}>
            <View
                style={[
                  styles.barFill,
                  {
                    width: "0%",
                    backgroundColor: "#D1D5DB",
                  },
                ]}
            />
          </View>

          {showLabel && (
              <View style={styles.scaleRow}>
                <Text style={styles.scaleLabel}>Empty</Text>
                <Text style={styles.scaleLabel}>Moderate</Text>
                <Text style={styles.scaleLabel}>Full</Text>
              </View>
          )}

          <Text style={styles.updatedAt}>
            Updated {formatUpdatedAt(crowd.updatedAt)}
          </Text>
        </View>
    );
  }

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

/**
 * Formats a given ISO date string into a relative time string such as "just now,"
 * "5m ago," or "2h ago" based on the difference between the current time and the input.
 *
 * @param {string} iso - The ISO date string to be formatted.
 * @return {string} A human-readable relative time string.
 */
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