import { CrowdDay, CrowdHistory, CrowdLevel } from "@/types";
import {useState, useRef, useEffect, JSX} from "react";
import { Animated } from "react-native";
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

/**
 * A mapping of crowd levels to their corresponding color codes.
 *
 * This object associates each predefined crowd level with a specific
 * hexadecimal color code that can be used for visual representation
 * in UI elements such as charts, maps, or status indicators.
 *
 * Keys:
 * - `low`: Indicates a low crowd level, associated with a green color.
 * - `moderate`: Indicates a moderate crowd level, associated with a yellow-orange color.
 * - `busy`: Indicates a busy crowd level, associated with an orange color.
 * - `very_busy`: Indicates a very busy crowd level, associated with a red color.
 *
 * Example values:
 * - low: "#10B981"
 * - moderate: "#F59E0B"
 * - busy: "#F97316"
 * - very_busy: "#EF4444"
 *
 * It is represented as a `Record` type where each key is a `CrowdLevel`
 * and the value is a `string` representing a color code.
 */
const LEVEL_COLORS: Record<CrowdLevel, string> = {
  low: "#10B981",
  moderate: "#F59E0B",
  busy: "#F97316",
  very_busy: "#EF4444",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CHART_WIDTH = 340;
const CHART_HEIGHT = 160;
const PADDING = { top: 10, bottom: 30, left: 28, right: 8 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const BAR_COUNT = 24;
const BAR_WIDTH = (PLOT_WIDTH / BAR_COUNT) * 0.7;
const BAR_GAP = PLOT_WIDTH / BAR_COUNT;

/**
 * Renders a crowd history chart that displays crowd levels by hour over the last 7 days.
 * Includes features such as day selection, a scrollable hourly chart, tooltips, and a legend.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.history - Historical crowd data, including days and their respective hours.
 * @param {Array<Object>} props.history.days - Array of crowd data for each day.
 * @param {string} props.history.days[].date - The date of the day in ISO 8601 format.
 * @param {string} props.history.days[].day - The name or label for the day.
 * @param {Array<Object>} props.history.days[].hours - Array of crowd data for each hour.
 * @param {number} props.history.days[].hours[].hour - The hour of the day (0-23).
 * @param {number} props.history.days[].hours[].percentage - Crowd percentage for the hour (0-100).
 * @param {string} props.history.days[].hours[].level - Level of crowd categorized (e.g., LOW, MEDIUM, HIGH).
 *
 * @return {JSX.Element} A React component that renders the crowd history chart.
 */
export default function CrowdHistoryChart({ history }: CrowdHistoryChartProps): JSX.Element {
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(history.days.length - 1);
  const [tooltip, setTooltip] = useState<{
    hour: number;
    percentage: number;
  } | null>(null);

  const [opacityValue, setOpacityValue] = useState(1);
  // Blinking animation
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Scroll to "today" on mount
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    blinkAnim.addListener(({ value }) => {
      setOpacityValue(value);
    });

    Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
    ).start();

    return () => {
      blinkAnim.removeAllListeners();
    };
  }, [blinkAnim]);

  const selectedDay: CrowdDay | undefined = history.days[selectedDayIndex];
  const currentHour = new Date().getHours();

  return (
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Crowd History</Text>
        <Text style={styles.subtitle}>Hour by hour — last 7 days</Text>

        {/* Day selector */}
        <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelector}
        >
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
                {/* Y-axis gridlines at 25, 50, 75, 100 */}
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

                {/* Y-axis labels */}
                {[0, 50, 100].map((tick) => {
                  const y = PADDING.top + PLOT_HEIGHT - (tick / 100) * PLOT_HEIGHT;
                  return (
                      <SvgText
                          key={tick}
                          x={PADDING.left - 10}
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

                  const isCurrentHour = h.hour === currentHour && selectedDayIndex === history.days.length - 1;

                  return (
                      <Rect
                          key={h.hour}
                          x={x}
                          y={barHeight > 0 ? y : PADDING.top + PLOT_HEIGHT - 2}
                          width={BAR_WIDTH}
                          height={Math.max(barHeight, 2)}
                          rx={2}
                          fill={LEVEL_COLORS[h.level]}
                          opacity={isCurrentHour ? opacityValue : 0.9}
                          stroke={isCurrentHour ? "#A6A09B" : "none"}
                          strokeWidth={isCurrentHour ? 0.5 : 0}
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

                {/* X-axis labels every 6 hours */}
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

// ... styles stay the same

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
    color: "#0A0A0A",
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
    backgroundColor: "#0A0A0A",
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
  liveLabel: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: "center",
  },
  liveLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  tooltip: {
    alignSelf: "center",
    backgroundColor: "#0A0A0A",
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
