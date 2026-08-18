import { CrowdLevel, CrowdLive } from "@/types";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { JSX, useState } from "react";

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
    low: { color: "#10B981", background: "#D1FAE5", label: "Not Busy", emoji: "🟢" },
    moderate: { color: "#F59E0B", background: "#FEF3C7", label: "Moderately Busy", emoji: "🟡" },
    busy: { color: "#F97316", background: "#FFEDD5", label: "Busy", emoji: "🟠" },
    very_busy: { color: "#EF4444", background: "#FEE2E2", label: "Very Busy", emoji: "🔴" },
};

/**
 * Desktop variant of CrowdMeter. Same data contract as the native component —
 * only the layout and interactivity differ (wider card, hover tooltip on the bar,
 * CSS-driven bar transition instead of a fixed-frame render).
 */
export default function CrowdMeterWeb({
                                          crowd,
                                          showLabel = true,
                                      }: CrowdMeterProps): JSX.Element {
    const [hovered, setHovered] = useState(false);
    const config = LEVEL_CONFIG[crowd.level];
    const closed = crowd.closed;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Live Crowd</Text>
                <View style={[styles.badge, { backgroundColor: closed ? "#F3F4F6" : config.background }]}>
                    <Text style={styles.badgeEmoji}>{closed ? "🔒" : config.emoji}</Text>
                    <Text style={[styles.badgeLabel, { color: closed ? "#9CA3AF" : config.color }]}>
                        {closed ? "Closed" : config.label}
                    </Text>
                </View>
            </View>

            <View style={styles.mainRow}>
                <Pressable
                    style={styles.barTrack}
                    onHoverIn={() => setHovered(true)}
                    onHoverOut={() => setHovered(false)}
                >
                    <View style={styles.barBackground}>
                        <View
                            style={[
                                styles.barFill,
                                {
                                    width: closed ? "0%" : (`${crowd.percentage}%` as any),
                                    backgroundColor: closed ? "#D1D5DB" : config.color,
                                    transitionProperty: "width" as any,
                                    transitionDuration: "400ms" as any,
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
                    {hovered && !closed && (
                        <View style={styles.tooltip}>
                            <Text style={styles.tooltipText}>
                                Updated {formatUpdatedAt(crowd.updatedAt)}
                            </Text>
                        </View>
                    )}
                </Pressable>

                <Text style={styles.percentage}>{closed ? "—" : `${crowd.percentage}%`}</Text>
            </View>
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
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 16,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0A0A0A",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeEmoji: { fontSize: 14 },
    badgeLabel: { fontSize: 14, fontWeight: "600" },
    mainRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    barTrack: {
        flex: 1,
        position: "relative",
    },
    barBackground: {
        height: 14,
        backgroundColor: "#F3F4F6",
        borderRadius: 7,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 7,
    },
    scaleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },
    scaleLabel: { fontSize: 11, color: "#9CA3AF" },
    percentage: {
        fontSize: 36,
        fontWeight: "700",
        color: "#1A1A2E",
        minWidth: 80,
        textAlign: "right",
    },
    tooltip: {
        position: "absolute",
        top: -34,
        left: 0,
        backgroundColor: "#0A0A0A",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tooltipText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});