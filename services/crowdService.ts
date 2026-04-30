import { CrowdLive, CrowdHistory } from '@/types';

const crowdService = {
  getLive: async (placeId: string): Promise<CrowdLive> => {
    try {
      const percentage = Math.floor(Math.random() * 100);
      const level =
          percentage < 25
              ? 'low'
              : percentage < 50
                  ? 'moderate'
                  : percentage < 75
                      ? 'busy'
                      : 'very_busy';

      const result = {
        placeId,
        percentage,
        level,
        updatedAt: new Date().toISOString(),
      };

      console.log('Live crowd data:', result);
      // @ts-ignore
      return result;
    } catch (err: any) {
      console.error('Live crowd error:', err);
      throw new Error('Failed to load live crowd data');
    }
  },

  getHistory: async (placeId: string): Promise<CrowdHistory> => {
    try {
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

          return {
            hour,
            percentage: Math.round(percentage),
            level:
                percentage < 25
                    ? 'low'
                    : percentage < 50
                        ? 'moderate'
                        : percentage < 75
                            ? 'busy'
                            : 'very_busy',
          };
        });

        return {
          day: date.getDay(),
          date: date.toISOString().split('T')[0],
          hours,
        };
      });

      const result = { placeId, days };
      console.log('Crowd history data:', result);
      // @ts-ignore
      return result;
    } catch (err: any) {
      console.error('History error:', err);
      throw new Error('Failed to load crowd history');
    }
  },
};

export { crowdService };