import { CrowdLive, CrowdHistory } from '@/types';

/**
 * An object providing crowd data services, including live crowd data and historical crowd patterns.
 *
 * The `crowdService` object consists of two main methods:
 * - `getLive`: Fetches the current crowd status for a specific place.
 * - `getHistory`: Retrieves historical crowd data for the past seven days.
 *
 * Both methods generate crowd data with crowd percentages and categorize them into the following levels:
 * - 'low' for percentages less than 25
 * - 'moderate' for percentages between 25 and 50
 * - 'busy' for percentages between 50 and 75
 * - 'very_busy' for percentages greater than or equal to 75
 *
 * These services use randomized or simulated data to reflect potential crowd scenarios.
 *
 * @typedef {Object} crowdService
 * @property {Function} getLive - Fetches real-time crowd data based on the provided place ID.
 * @property {Function} getHistory - Retrieves and simulates past seven days of crowd history data for a place ID.
 */
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

  /**
   * Asynchronously retrieves simulated crowd history data for a specified place ID.
   *
   * The method generates crowd level data for the past 7 days, where each day contains
   * hourly crowd percentage estimations and corresponding crowd levels. The crowd levels
   * are categorized as:
   * - 'low' for percentages less than 25
   * - 'moderate' for percentages between 25 and 50
   * - 'busy' for percentages between 50 and 75
   * - 'very_busy' for percentages greater than or equal to 75
   *
   * The data uses randomized variations around baseline crowd percentages,
   * which are determined by specific time ranges:
   * - 8:00 AM to 12:00 PM: ~70%
   * - 12:00 PM to 2:00 PM: ~85%
   * - 5:00 PM to 8:00 PM: ~75%
   * - 10:00 PM to 6:00 AM: ~15%
   * - Other times: ~20%
   *
   * If the operation fails, the method logs the error and throws a `Failed to load crowd history` exception.
   *
   * @param {string} placeId - The unique identifier of the place for which crowd history is retrieved.
   * @returns {Promise<CrowdHistory>} A promise that resolves to an object containing the crowd history data.
   * @throws {Error} Throws an error if the operation fails.
   */
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