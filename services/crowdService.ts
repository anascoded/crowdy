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

// Helper function to poll for results when the status is 202
const pollForResults = async (resultsUrl: string): Promise<any> => {
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s
    const response = await fetch(resultsUrl, { headers: { 'X-API-KEY': OUTSCRAPER_API_KEY! } });
    const data = await response.json();

    if (data.status === 'Success') return data;
    if (data.status === 'Error') throw new Error('Scraping failed');
  }
  throw new Error('Polling timed out');
};

// Helper function to check if place is open
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