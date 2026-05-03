import { CrowdLive, CrowdHistory, CrowdLevel } from '@/types';

const BESTTIME_API_KEY = process.env.EXPO_PUBLIC_BESTTIME_API_KEYA;

const crowdService = {
  getLive: async (placeId: string): Promise<CrowdLive> => {
    try {
      const response = await fetch(
          `https://api.besttime.app/v1/forecasts?api_key_token=${BESTTIME_API_KEY}&venue_id=${placeId}`,
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const forecast = data.forecasts?.[0];
      const percentage = forecast?.busyness ?? 50;
      const level: CrowdLevel =
          percentage < 25
              ? 'low'
              : percentage < 50
                  ? 'moderate'
                  : percentage < 75
                      ? 'busy'
                      : 'very_busy';

      return {
        placeId,
        percentage,
        level,
        updatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.log('BestTime API Error:', err.message, err);
      const percentage = Math.floor(Math.random() * 100);
      const level: CrowdLevel = percentage < 25 ? 'low' : percentage < 50 ? 'moderate' : percentage < 75 ? 'busy' : 'very_busy';
      return { placeId, percentage, level, updatedAt: new Date().toISOString() };
    }
  },

  getHistory: async (placeId: string): Promise<CrowdHistory> => {
    try {
      const response = await fetch(
          `https://api.besttime.app/v1/forecasts?api_key_token=${BESTTIME_API_KEY}&venue_id=${placeId}`,
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const days = data.forecasts?.slice(0, 7).map((forecast: any, index: number) => {
        const date = new Date();
        date.setDate(date.getDate() + index);

        const hours = (forecast.hourly ?? []).map((busyness: number, hour: number) => {
          const level: CrowdLevel = busyness < 25 ? 'low' : busyness < 50 ? 'moderate' : busyness < 75 ? 'busy' : 'very_busy';
          return {
            hour,
            percentage: busyness,
            level,
          };
        });

        return {
          day: date.getDay(),
          date: date.toISOString().split('T')[0],
          hours,
        };
      }) ?? [];

      return { placeId, days };
    } catch (err: any) {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const hours = Array.from({ length: 24 }, (_, hour) => {
          let basePercentage = 20;
          if (hour >= 8 && hour <= 12) basePercentage = 70;
          if (hour >= 12 && hour <= 14) basePercentage = 85;
          if (hour >= 17 && hour <= 20) basePercentage = 75;
          if (hour >= 22 || hour <= 6) basePercentage = 15;
          const variation = (Math.random() - 0.5) * 30;
          const percentage = Math.max(0, Math.min(100, basePercentage + variation));
          const level: CrowdLevel = percentage < 25 ? 'low' : percentage < 50 ? 'moderate' : percentage < 75 ? 'busy' : 'very_busy';
          return { hour, percentage: Math.round(percentage), level };
        });
        return { day: date.getDay(), date: date.toISOString().split('T')[0], hours };
      });
      return { placeId, days };
    }
  },
};

export { crowdService };