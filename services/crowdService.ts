import { CrowdLive, CrowdHistory, CrowdLevel } from '@/types';

const OUTSCRAPER_API_KEY = process.env.EXPO_PUBLIC_OUTSCRAPER_API_KEY;

// Helper function to parse time strings like "11AM" or "2:30PM" to minutes
const parseTime = (timeStr?: string): number => {
  if (!timeStr || typeof timeStr !== 'string') {
    return NaN;
  }

  const trimmed = timeStr.trim();

  if (!trimmed) {
    return NaN;
  }

  const isPM = trimmed.includes('PM');
  const cleanStr = trimmed.replace(/AM|PM/g, '').trim();

  const parts = cleanStr.split(':');

  let hours = parseInt(parts[0], 10);

  if (Number.isNaN(hours)) {
    return NaN;
  }

  const minutes =
      parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;

  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper to get timezone offset for a location
const getLocationTimezone = (latitude: number, longitude: number): number => {
  // This is a simplified approach using device timezone
  // For precise location-based timezone, you'd need a timezone API
  return new Date().getTimezoneOffset() / 60;
};

/**
 * Polls a given results URL for a set duration to retrieve processed data status.
 * It makes repeated requests at regular intervals and returns the data if the status is successful.
 * If the status indicates failure or an error after the duration, an error is thrown.
 *
 * @param {string} resultsUrl - The URL to poll for the result data status.
 * @return {Promise<Object>} The parsed JSON data from the server response if the status is 'Success'.
 * @throws {Error} If the status is 'Failure', 'Error', or no success is achieved within the polling period.
 */
export async function pollForResults(resultsUrl: string): Promise<object> {
  // 1. Increase loop iterations from 15 to 30 to give the scraper up to 90 seconds
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

    try {
      const response = await fetch(resultsUrl, {
        headers: { 'X-API-KEY': OUTSCRAPER_API_KEY! }
      });

      if (!response.ok) {
        console.warn(`Outscraper server responded with HTTP status: ${response.status}`);
        continue; // Keep trying if it's a temporary gateway hiccup
      }

      const data = await response.json();

      // 2. Check the payload compilation status safely
      if (data.status === 'Success') {
        return data;
      }

      if (data.status === 'Failure' || data.status === 'Error') {
        throw new Error(`Outscraper processing failed: ${data.message || 'Unknown error'}`);
      }

      console.log(`[Polling iteration ${i + 1}/30]: Status is still "${data.status}"...`);

    } catch (fetchError) {
      // Catch network drops inside the loop so one bad network ping doesn't kill the whole app
      console.warn("Temporary network glitch during live crowd polling:", fetchError);
    }
  }

  // 3. Throw a helpful error if we hit the true 90-second boundary
  throw new Error('Live crowd error: Outscraper task took longer than 90 seconds to compile. Please try refreshing.');
}

/**
 * Determines whether a place is currently open based on its working hours.
 *
 * @param {Object} workingHours - The working hours object, where keys are day names
 * (e.g., 'Monday', 'Tuesday') and values are arrays of strings representing time ranges
 * (e.g., ['11:00-22:00']).
 *
 * @returns {boolean} - Returns `true` if the current time falls within the specified
 * working hours or no valid working hour data exists. Returns `false` if the place
 * is explicitly closed based on the given schedule.
 */
const isOpenNow = (workingHours: any): boolean => {
  if (!workingHours) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[currentDay];

  const todayHours = workingHours[todayName];
  if (!todayHours || todayHours.length === 0) return false;

  const hoursStr = todayHours[0];
  if (
      !hoursStr ||
      typeof hoursStr !== 'string' ||
      !hoursStr.includes('-')
  ) {
    return true;
  }

  const [openStr, closeStr] = hoursStr.split('-');

  try {
    const openMinutes = parseTime(openStr);
    const closeMinutes = parseTime(closeStr);

    if (
        Number.isNaN(openMinutes) ||
        Number.isNaN(closeMinutes)
    ) {
      return true;
    }
    const nowMinutes = currentHour * 60 + currentMinute;

    // If close time is less than open time, it means closing next day (e.g., 11AM-2AM)
    if (closeMinutes < openMinutes) {
      // Place is open if: after open time OR before close time (next day)
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }

    // Normal case: same day (e.g., 11AM-9PM)
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  } catch (err) {
    console.error('Error parsing time:', err);
    return true;
  }
};

/**
 * A service for collecting live and historical crowd data for a specific place.
 */
const crowdService = {
  getLive: async (placeId: string): Promise<CrowdLive> => {
    try {
      const url = `https://api.outscraper.cloud/maps/search-v2?query=${encodeURIComponent(placeId)}&api_key=${OUTSCRAPER_API_KEY}`;
      const response = await fetch(url);

      let data;
      if (response.status === 202) {
        const meta = await response.json();
        data = await pollForResults(meta.results_location);
      } else {
        data = await response.json();
      }

      if (!data.data || !data.data[0]) throw new Error('No data found');

      const place = data.data[0][0];

      // Check if open
      if (!isOpenNow(place.working_hours)) {
        return {
          placeId,
          percentage: 0,
          level: 'low',
          updatedAt: new Date().toISOString(),
          closed: true,
        };
      }

      const popularTimes = place.popular_times || [];
      const today = new Date().getDay();
      const currentHour = new Date().getHours();

      const todayData = popularTimes.find((d: any) => d.day === (today === 0 ? 7 : today));
      const hourData = todayData?.popular_times?.find((h: any) => h.hour === currentHour);
      const percentage = hourData?.percentage ?? 50;

      const level: CrowdLevel = percentage < 25 ? 'low' : percentage < 50 ? 'moderate' : percentage < 75 ? 'busy' : 'very_busy';

      return { placeId, percentage, level, updatedAt: new Date().toISOString() };
    } catch (err) {
      console.error('Live crowd error:', err);
      return { placeId, percentage: 50, level: 'moderate', updatedAt: new Date().toISOString() };
    }
  },

  /**
   * Retrieves the historical crowd data for a given place.
   *
   * @param {string} placeId - The unique identifier of the place to fetch crowd history for.
   * @returns {Promise<CrowdHistory>} A promise that resolves to an object containing the place ID and an array of crowd data.
   *
   * The returned `CrowdHistory` object includes:
   * - `days`: An array of objects representing daily crowd levels organized by weekday. Each object contains:
   *   - `day`: The numeric representation of the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday).
   *   - `date`: A timestamp for the last occurrence of the weekday.
   *   - `hours`: An array containing crowd level information for each hour, including:
   *     - `hour`: The hour of the day (0-23).
   *     - `percentage`: Percentage indicating the crowd level.
   *     - `level`: A qualitative label ("low", "moderate", "busy", or "very_busy") based on crowd percentage.
   *
   * The function performs the following steps:
   * 1. Constructs and sends an API request to fetch data for the specified `placeId`.
   * 2. Handles asynchronous polling for results if the initial response has a `202: Accepted` status.
   * 3. Parses and processes the data to generate crowd history organized by day and hour.
   * 4. Converts the raw weekday indices into JavaScript Date objects for proper time formatting.
   * 5. Returns the organized crowd history in chronological order based on day timestamps.
   *
   * If the API response contains no valid data, or an error occurs during processing,
   * the function logs the error and resolves to an object containing an empty `days` array.
   */
  getHistory: async (placeId: string): Promise<CrowdHistory> => {
    try {
      const url = `https://api.outscraper.cloud/maps/search-v2?query=${encodeURIComponent(placeId)}&api_key=${OUTSCRAPER_API_KEY}`;
      const response = await fetch(url);

      let data;
      if (response.status === 202) {
        const meta = await response.json();
        data = await pollForResults(meta.results_location);
      } else {
        data = await response.json();
      }

      if (!data.data || !data.data[0]) throw new Error('No data found');

      const place = data.data[0][0];
      const popularTimes = Array.isArray(place.popular_times)
          ? place.popular_times
          : [];

      const today = new Date();

      const days = popularTimes
          .map((dayData: any) => {
            // Ensure numeric weekday
            const rawDay = Number(dayData.day);

            // Skip invalid days
            if (Number.isNaN(rawDay)) {
              return null;
            }

            // Convert API format: 7 = Sunday -> JS format: 0 = Sunday
            const dayOfWeek = rawDay === 7 ? 0 : rawDay;

            // Calculate most recent occurrence of this weekday
            let diff = today.getDay() - dayOfWeek;

            if (diff < 0) {
              diff += 7;
            }

            const date = new Date(today);
            date.setDate(today.getDate() - diff);

            // Safer local formatting (avoids toISOString timezone bugs)
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear();

            const localDate = date.getTime();

            return {
              day: dayOfWeek,
              date: localDate,
              hours: (dayData.popular_times || []).map((h: any) => ({
                hour: h.hour,
                percentage: h.percentage,
                level:
                    h.percentage < 25
                        ? "low"
                        : h.percentage < 50
                            ? "moderate"
                            : h.percentage < 75
                                ? "busy"
                                : "very_busy",
              })),
            };
          })
          .filter(Boolean);

      // Sort oldest -> newest
      days.sort(
          (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return { placeId, days };
    } catch (err) {
      console.error('History error:', err);
      return { placeId, days: [] };
    }
  },
};

export { crowdService };