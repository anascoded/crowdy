import { CrowdLive, CrowdHistory, CrowdLevel } from '@/types';

const OUTSCRAPER_API_KEY = process.env.EXPO_PUBLIC_OUTSCRAPER_API_KEY;

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
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[currentDay];

  const todayHours = workingHours[todayName];
  if (!todayHours || todayHours.length === 0) return false;

  const hoursStr = todayHours[0];
  const [openStr, closeStr] = hoursStr.split('-');

  const parseTime = (timeStr: string): number => {
    const isPM = timeStr.includes('PM');
    let [hours, minutes] = timeStr.replace(/AM|PM/g, '').split(':').map(Number);
    minutes = minutes || 0;
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const openMinutes = parseTime(openStr);
  const closeMinutes = parseTime(closeStr);
  const nowMinutes = currentHour * 60 + currentMinute;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
};

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
      const popularTimes = place.popular_times || [];

      const days = popularTimes.map((dayData: any, index: number) => {
        // Calculate actual date for this day
        const date = new Date();
        const today = new Date().getDay();
        const dayOfWeek = dayData.day === 7 ? 0 : dayData.day;
        const daysBack = (today - dayOfWeek + 7) % 7 || (index === 0 ? 0 : 7);
        date.setDate(date.getDate() - daysBack);

        return {
          day: dayOfWeek,
          date: date.toISOString().split('T')[0], // Actual date like "2026-05-08"
          hours: dayData.popular_times.map((h: any) => ({
            hour: h.hour,
            percentage: h.percentage,
            level: h.percentage < 25 ? 'low' : h.percentage < 50 ? 'moderate' : h.percentage < 75 ? 'busy' : 'very_busy',
          })),
        };
      });

      return { placeId, days };
    } catch (err) {
      console.error('History error:', err);
      return { placeId, days: [] };
    }
  },
};

export { crowdService };