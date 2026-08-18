import { CrowdDay, CrowdHistory, CrowdLevel } from "@/types";
import React, { JSX, useState, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";


interface CrowdHistoryChartProps {
    history: CrowdHistory;
}

const LEVEL_COLORS: Record<CrowdLevel, string> = {
    low: "#10B981",
    moderate: "#F59E0B",
    busy: "#F97316",
    very_busy: "#EF4444",
};

// Matches types/index.ts: CrowdDay.day is documented as 0 = Monday … 6 = Sunday.
// (Native CrowdHistoryChart.tsx currently uses a Sun-first array — worth
// reconciling separately; this file follows the documented type.)
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// react-native-svg's types don't declare DOM mouse events (onMouseEnter/
// onMouseLeave), even though react-native-svg-web forwards them to the
// underlying <rect> element at runtime on web. Casting locally since this
// file only renders in web builds.
type HoverableRectProps = React.ComponentProps<typeof Rect> & {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

const HoverableRect = Rect as unknown as React.ComponentType<HoverableRectProps>;

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING = { top: 12, bottom: 32, left: 36, right: 12 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const BAR_COUNT = 24;
const BAR_WIDTH = (PLOT_WIDTH / BAR_COUNT) * 0.65;
const BAR_GAP = PLOT_WIDTH / BAR_COUNT;

/**
 * Desktop variant of CrowdHistoryChart. Wider fixed-width SVG (no horizontal
 * scroll needed at desktop viewport sizes), hover-driven tooltips instead of
 * tap-to-toggle, and no day-selector horizontal scroll chrome — days render
 * as a plain row since there's room for all 7 at once.
 */
export default function CrowdHistoryChartWeb({ history }: CrowdHistoryChartProps): JSX.Element {
    const [selectedDayIndex, setSelectedDayIndex] = useState(history.days.length - 1);
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);

    const selectedDay: CrowdDay | undefined = history.days[selectedDayIndex];
    const currentHour = new Date().getHours();

    const hoveredData = useMemo(() => {
        if (hoveredHour === null || !selectedDay) return null;
        return selectedDay.hours.find((h) => h.hour === hoveredHour) ?? null;
    }, [hoveredHour, selectedDay]);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.title}>Crowd History</Text>
                    <Text style={styles.subtitle}>Hour by hour — last 7 days</Text>
                </View>
                {hoveredData && (
                    <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>
                            {hoveredData.hour}:00 — {hoveredData.percentage}% busy
                        </Text>
                    </View>
                )}
            </View>

            {/* Day selector — full row, no scroll needed at desktop width */}
            <View style={styles.daySelector}>
                {history.days.map((day, index) => {
                    const isSelected = index === selectedDayIndex;
                    const label = DAY_LABELS[day.day] ?? `Day ${index + 1}`;
                    const date = new Date(Number(day.date));
                    const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

                    return (
                        <TouchableOpacity
                            key={day.date}
                            style={[styles.dayTab, isSelected && styles.dayTabSelected]}
                            onPress={() => {
                                setSelectedDayIndex(index);
                                setHoveredHour(null);
                            }}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.dayTabLabel, isSelected && styles.dayTabLabelSelected]}>
                                {label}
                            </Text>
                            <Text style={[styles.dayTabDate, isSelected && styles.dayTabDateSelected]}>
                                {dateLabel}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Chart */}
            {selectedDay ? (
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    {[25, 50, 75, 100].map((tick) => {
                        const y = PADDING.top + PLOT_HEIGHT - (tick / 100) * PLOT_HEIGHT;
                        return (
                            <Line
                                key={tick}
                                x1={PADDING.left}
                                y1={y}
                                x2={PADDING.left + PLOT_WIDTH}
                                y2={y}
                                stroke="#F3F4F6"
                                strokeWidth={1}
                                strokeDasharray="4,4"
                            />
                        );
                    })}

                    {[0, 50, 100].map((tick) => {
                        const y = PADDING.top + PLOT_HEIGHT - (tick / 100) * PLOT_HEIGHT;
                        return (
                            <SvgText key={tick} x={PADDING.left - 10} y={y + 4} fontSize={10} fill="#9CA3AF" textAnchor="end">
                                {tick}%
                            </SvgText>
                        );
                    })}

                    {selectedDay.hours.map((h) => {
                        const barHeight = (h.percentage / 100) * PLOT_HEIGHT;
                        const x = PADDING.left + h.hour * BAR_GAP + (BAR_GAP - BAR_WIDTH) / 2;
                        const y = PADDING.top + PLOT_HEIGHT - barHeight;
                        const isCurrentHour = h.hour === currentHour && selectedDayIndex === history.days.length - 1;
                        const isHovered = hoveredHour === h.hour;

                        return (
                            <HoverableRect
                                key={h.hour}
                                x={x}
                                y={barHeight > 0 ? y : PADDING.top + PLOT_HEIGHT - 2}
                                width={BAR_WIDTH}
                                height={Math.max(barHeight, 2)}
                                rx={3}
                                fill={LEVEL_COLORS[h.level]}
                                opacity={isHovered ? 1 : isCurrentHour ? 0.95 : 0.85}
                                stroke={isCurrentHour ? "#A6A09B" : isHovered ? "#1A1A2E" : "none"}
                                strokeWidth={isCurrentHour || isHovered ? 1 : 0}
                                onMouseEnter={() => setHoveredHour(h.hour)}
                                onMouseLeave={() => setHoveredHour(null)}
                            />
                        );
                    })}

                    {[0, 6, 12, 18, 23].map((hour) => {
                        const x = PADDING.left + hour * BAR_GAP + BAR_GAP / 2;
                        return (
                            <SvgText key={hour} x={x} y={CHART_HEIGHT - 8} fontSize={10} fill="#9CA3AF" textAnchor="middle">
                                {hour}h
                            </SvgText>
                        );
                    })}
                </Svg>
            ) : (
                <View style={styles.emptyChart}>
                    <Text style={styles.emptyText}>No data available for this day</Text>
                </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
                {(Object.entries(LEVEL_COLORS) as [CrowdLevel, string][]).map(([level, color]) => (
                    <View key={level} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color }]} />
                        <Text style={styles.legendLabel}>{level.replace("_", " ")}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 14,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    title: { fontSize: 18, fontWeight: "700", color: "#0A0A0A" },
    subtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
    tooltip: {
        backgroundColor: "#0A0A0A",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tooltipText: { color: "#fff", fontSize: 13, fontWeight: "600" },
    daySelector: {
        flexDirection: "row",
        gap: 8,
    },
    dayTab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
    },
    dayTabSelected: { backgroundColor: "#0A0A0A" },
    dayTabLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
    dayTabLabelSelected: { color: "#fff" },
    dayTabDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
    dayTabDateSelected: { color: "#EDE9FE" },
    emptyChart: { height: 220, alignItems: "center", justifyContent: "center" },
    emptyText: { fontSize: 14, color: "#9CA3AF" },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: 16, paddingTop: 4 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 12, color: "#6B7280", textTransform: "capitalize" },
});