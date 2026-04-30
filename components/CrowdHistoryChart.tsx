import { CrowdDay, CrowdHistory, CrowdLevel } from "@/types";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHART_WIDTH = 340;
const CHART_HEIGHT = 160;
const PADDING = { top: 10, bottom: 30, left: 36, right: 8 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const BAR_COUNT = 24;
const BAR_WIDTH = (PLOT_WIDTH / BAR_COUNT) * 0.7;
const BAR_GAP = PLOT_WIDTH / BAR_COUNT;

export default function CrowdHistoryChart({ history }: CrowdHistoryChartProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [tooltip, setTooltip] = useState<{
    hour: number;
    percentage: number;
  } | null>(null);

  const selectedDay: CrowdDay | undefined = history.days[selectedDayIndex];

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Crowd History</Text>
      <Text style={styles.subtitle}>Hour by hour — last 7 days</Text>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      >
        {history.days.map((day, index) => {
          const isSelected = index === selectedDayIndex;
          const label = DAY_LABELS[day.day] ?? `Day ${index + 1}`;
          const date = new Date(day.date);
          const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.dayTab, isSelected && styles.dayTabSelected]}
              onPress={() => {
                setSelectedDayIndex(index);
                setTooltip(null);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.dayTabLabel,
                  isSelected && styles.dayTabLabelSelected,
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  styles.dayTabDate,
                  isSelected && styles.dayTabDateSelected,
                ]}
              >
                {dateLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tooltip */}
      {tooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {tooltip.hour}:00 — {tooltip.percentage}%
          </Text>
        </View>
      )}

      {/* Chart */}
      {selectedDay ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            {/* Y axis gridlines at 25, 50, 75, 100 */}
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

            {/* Y axis labels */}
            {[0, 50, 100].map((tick) => {
              const y = PADDING.top + PLOT_HEIGHT - (tick / 100) * PLOT_HEIGHT;
              return (
                <SvgText
                  key={tick}
                  x={PADDING.left - 4}
                  y={y + 4}
                  fontSize={9}
                  fill="#9CA3AF"
                  textAnchor="end"
                >
                  {tick}%
                </SvgText>
              );
            })}

            {/* Bars */}
            {selectedDay.hours.map((h) => {
              const barHeight = (h.percentage / 100) * PLOT_HEIGHT;
              const x =
                PADDING.left + h.hour * BAR_GAP + (BAR_GAP - BAR_WIDTH) / 2;
              const y = PADDING.top + PLOT_HEIGHT - barHeight;

              return (
                <Rect
                  key={h.hour}
                  x={x}
                  y={barHeight > 0 ? y : PADDING.top + PLOT_HEIGHT - 2}
                  width={BAR_WIDTH}
                  height={Math.max(barHeight, 2)}
                  rx={2}
                  fill={LEVEL_COLORS[h.level]}
                  opacity={0.9}
                  onPress={() =>
                    setTooltip(
                      tooltip?.hour === h.hour
                        ? null
                        : { hour: h.hour, percentage: h.percentage },
                    )
                  }
                />
              );
            })}

            {/* X axis labels every 6 hours */}
            {[0, 6, 12, 18, 23].map((hour) => {
              const x = PADDING.left + hour * BAR_GAP + BAR_GAP / 2;
              return (
                <SvgText
                  key={hour}
                  x={x}
                  y={CHART_HEIGHT - 6}
                  fontSize={9}
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {hour}h
                </SvgText>
              );
            })}
          </Svg>
        </ScrollView>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available for this day</Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {(Object.entries(LEVEL_COLORS) as [CrowdLevel, string][]).map(
          ([level, color]) => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{level.replace("_", " ")}</Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: -8,
  },
  daySelector: {
    gap: 8,
    paddingVertical: 4,
  },
  dayTab: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    minWidth: 56,
  },
  dayTabSelected: {
    backgroundColor: "#4A0404",
  },
  dayTabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  dayTabLabelSelected: {
    color: "#fff",
  },
  dayTabDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  dayTabDateSelected: {
    color: "#EDE9FE",
  },
  tooltip: {
    alignSelf: "center",
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyChart: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
});
