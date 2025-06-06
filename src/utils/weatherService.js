// OpenMeteo API weather service
const OPENMETEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Weather code mappings from OpenMeteo
const WEATHER_CODES = {
  0: 'sunny',
  1: 'sunny', // Mainly clear
  2: 'cloudy', // Partly cloudy
  3: 'cloudy', // Overcast
  45: 'foggy', // Fog
  48: 'foggy', // Depositing rime fog
  51: 'rainy', // Light drizzle
  53: 'rainy', // Moderate drizzle
  55: 'rainy', // Dense drizzle
  61: 'rainy', // Slight rain
  63: 'rainy', // Moderate rain
  65: 'rainy', // Heavy rain
  71: 'snowy', // Slight snow fall
  73: 'snowy', // Moderate snow fall
  75: 'snowy', // Heavy snow fall
  95: 'thunderstorm', // Thunderstorm
  96: 'thunderstorm', // Thunderstorm with slight hail
  99: 'thunderstorm', // Thunderstorm with heavy hail
};

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius) => {
  return (celsius * 9/5) + 32;
};

// Temperature ranges (in Fahrenheit)
const TEMPERATURE_RANGES = {
  cold: (temp) => temp < 50,    // Below 50°F (10°C)
  cool: (temp) => temp >= 50 && temp < 68,   // 50-67°F (10-19°C)
  warm: (temp) => temp >= 68 && temp < 86,   // 68-85°F (20-29°C)
  hot: (temp) => temp >= 86     // 86°F+ (30°C+)
};

export const weatherService = {
  /**
   * Get weather forecast for a location and date range
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {string} startDate - YYYY-MM-DD format
   * @param {string} endDate - YYYY-MM-DD format
   * @returns {Promise<Array>} Weather data for each day
   */
  async getWeatherForecast(latitude, longitude, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: startDate,
        end_date: endDate,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        hourly: 'weather_code,temperature_2m',
        timezone: 'auto'
      });

      const response = await fetch(`${OPENMETEO_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  },

  /**
   * Parse OpenMeteo response into our format
   * @param {Object} data - OpenMeteo API response
   * @returns {Array} Parsed weather data
   */
  parseWeatherData(data) {
    const { daily, hourly } = data;
    
    return daily.time.map((date, index) => ({
      date,
      weatherCode: daily.weather_code[index],
      weatherCondition: WEATHER_CODES[daily.weather_code[index]] || 'unknown',
      maxTemp: celsiusToFahrenheit(daily.temperature_2m_max[index]),
      minTemp: celsiusToFahrenheit(daily.temperature_2m_min[index]),
      avgTemp: celsiusToFahrenheit((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2),
      hourlyData: this.getHourlyDataForDate(hourly, date)
    }));
  },

  /**
   * Extract hourly data for a specific date
   * @param {Object} hourly - Hourly weather data
   * @param {string} targetDate - Date to extract data for
   * @returns {Array} Hourly weather data for the date
   */
  getHourlyDataForDate(hourly, targetDate) {
    return hourly.time
      .map((time, index) => ({
        time,
        weatherCode: hourly.weather_code[index],
        weatherCondition: WEATHER_CODES[hourly.weather_code[index]] || 'unknown',
        temperature: celsiusToFahrenheit(hourly.temperature_2m[index])
      }))
      .filter(hour => hour.time.startsWith(targetDate));
  },

  /**
   * Find the best date for an event based on weather preferences
   * @param {Array} weatherData - Array of daily weather data
   * @param {string|Array} preferredWeather - Desired weather condition(s)
   * @param {string|null} preferredTempRange - Desired temperature range (ignored if null)
   * @param {string} preferredStartTime - Preferred start time (optional)
   * @param {string} preferredEndTime - Preferred end time (optional)
   * @returns {Object|null} Best matching date/time or null if not found
   */
  findBestEventDate(weatherData, preferredWeather, preferredTempRange, preferredStartTime = null, preferredEndTime = null) {
    // Handle both single condition (string) and multiple conditions (array)
    const weatherConditions = Array.isArray(preferredWeather) ? preferredWeather : [preferredWeather];
    
    for (const dayData of weatherData) {
      // Check if the day matches any of the weather preferences
      const weatherMatches = weatherConditions.includes(dayData.weatherCondition);
      // Skip temperature matching if preferredTempRange is null
      const tempMatches = preferredTempRange ? TEMPERATURE_RANGES[preferredTempRange]?.(dayData.avgTemp) : true;

      if (weatherMatches && tempMatches) {
        // If specific time range is preferred, try to find a good time slot
        if (preferredStartTime && preferredEndTime && dayData.hourlyData.length > 0) {
          const timeSlot = this.findBestTimeSlotInDay(dayData.hourlyData, weatherConditions, preferredTempRange, preferredStartTime, preferredEndTime);
          
          if (timeSlot) {
            return {
              date: dayData.date,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              weather: timeSlot.weatherCondition,
              temperature: timeSlot.avgTemperature,
              confidence: 'high'
            };
          }
        }

        // Return the day with default times if no specific time preference or no suitable slot found
        return {
          date: dayData.date,
          startTime: preferredStartTime || '10:00',
          endTime: preferredEndTime || '11:00',
          weather: dayData.weatherCondition,
          temperature: dayData.avgTemp,
          confidence: 'medium'
        };
      }
    }

    return null; // No suitable date found
  },

  /**
   * Find the best hour within a day
   * @param {Array} hourlyData - Hourly weather data for a day
   * @param {string|Array} preferredWeather - Desired weather condition(s)
   * @param {string|null} preferredTempRange - Desired temperature range (ignored if null)
   * @param {number} preferredHour - Preferred hour (0-23)
   * @returns {Object|null} Best hour or null
   */
  findBestHourInDay(hourlyData, preferredWeather, preferredTempRange, preferredHour) {
    // Handle both single condition (string) and multiple conditions (array)
    const weatherConditions = Array.isArray(preferredWeather) ? preferredWeather : [preferredWeather];
    
    // First, try to find an exact match at the preferred hour
    const exactMatch = hourlyData.find(hour => {
      const hourNum = parseInt(hour.time.split('T')[1].split(':')[0]);
      const tempMatches = preferredTempRange ? TEMPERATURE_RANGES[preferredTempRange]?.(hour.temperature) : true;
      return hourNum === preferredHour && 
             weatherConditions.includes(hour.weatherCondition) &&
             tempMatches;
    });

    if (exactMatch) return exactMatch;

    // Then try to find any hour with matching weather and temperature
    return hourlyData.find(hour => {
      const tempMatches = preferredTempRange ? TEMPERATURE_RANGES[preferredTempRange]?.(hour.temperature) : true;
      return weatherConditions.includes(hour.weatherCondition) && tempMatches;
    });
  },

  /**
   * Get user's current location
   * @returns {Promise<{latitude: number, longitude: number}>}
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          // Fallback to a default location (e.g., New York City)
          console.warn('Could not get user location, using default:', error);
          resolve({
            latitude: 40.7128,
            longitude: -74.0060
          });
        }
      );
    });
  },

  /**
   * Geocode a location name to get coordinates
   * @param {string} locationName - Location name (e.g., "New York, NY")
   * @returns {Promise<{latitude: number, longitude: number}>}
   */
  async geocodeLocation(locationName) {
    try {
      // Extract just the city name for the API call
      const cityName = locationName.split(',')[0].trim();
      
      const params = new URLSearchParams({
        name: cityName,
        count: 1,
        language: 'en',
        format: 'json'
      });

      const response = await fetch(`${GEOCODING_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`Location "${locationName}" not found`);
      }

      const result = data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country
      };
    } catch (error) {
      console.error('Error geocoding location:', error);
      throw error;
    }
  },

  /**
   * Find the best time slot within a day
   * @param {Array} hourlyData - Hourly weather data for a day
   * @param {string|Array} preferredWeather - Desired weather condition(s)
   * @param {string|null} preferredTempRange - Desired temperature range (ignored if null)
   * @param {string} preferredStartTime - Preferred start time (HH:MM)
   * @param {string} preferredEndTime - Preferred end time (HH:MM)
   * @returns {Object|null} Best time slot or null
   */
  findBestTimeSlotInDay(hourlyData, preferredWeather, preferredTempRange, preferredStartTime, preferredEndTime) {
    // Handle both single condition (string) and multiple conditions (array)
    const weatherConditions = Array.isArray(preferredWeather) ? preferredWeather : [preferredWeather];
    
    const startHour = parseInt(preferredStartTime.split(':')[0]);
    const endHour = parseInt(preferredEndTime.split(':')[0]);
    const duration = endHour - startHour;
    
    if (duration <= 0) return null; // Invalid time range

    // Try to find a time slot where all hours match any of the weather conditions
    for (let hour = startHour; hour <= 24 - duration; hour++) {
      const timeSlotHours = hourlyData.filter(hourData => {
        const hourNum = parseInt(hourData.time.split('T')[1].split(':')[0]);
        return hourNum >= hour && hourNum < hour + duration;
      });

      if (timeSlotHours.length === duration) {
        // Check if all hours in this slot match weather preferences
        const allMatch = timeSlotHours.every(hourData => {
          const tempMatches = preferredTempRange ? TEMPERATURE_RANGES[preferredTempRange]?.(hourData.temperature) : true;
          return weatherConditions.includes(hourData.weatherCondition) && tempMatches;
        });

        if (allMatch) {
          const avgTemp = timeSlotHours.reduce((sum, h) => sum + h.temperature, 0) / timeSlotHours.length;
          // Use the actual weather condition found (could be any of the preferred ones)
          const actualWeather = timeSlotHours[0].weatherCondition;
          return {
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + duration).toString().padStart(2, '0')}:00`,
            weatherCondition: actualWeather,
            avgTemperature: avgTemp
          };
        }
      }
    }

    // If no perfect match, try to find the best available slot at the preferred time
    const preferredSlotHours = hourlyData.filter(hourData => {
      const hourNum = parseInt(hourData.time.split('T')[1].split(':')[0]);
      return hourNum >= startHour && hourNum < endHour;
    });

    if (preferredSlotHours.length > 0) {
      const weatherMatches = preferredSlotHours.filter(hourData => {
        const tempMatches = preferredTempRange ? TEMPERATURE_RANGES[preferredTempRange]?.(hourData.temperature) : true;
        return weatherConditions.includes(hourData.weatherCondition) && tempMatches;
      });

      // If at least half of the time slot has good weather, accept it
      if (weatherMatches.length >= Math.ceil(preferredSlotHours.length / 2)) {
        const avgTemp = preferredSlotHours.reduce((sum, h) => sum + h.temperature, 0) / preferredSlotHours.length;
        // Use the most common acceptable weather condition
        const actualWeather = weatherMatches[0].weatherCondition;
        return {
          startTime: preferredStartTime,
          endTime: preferredEndTime,
          weatherCondition: actualWeather,
          avgTemperature: avgTemp
        };
      }
    }

    return null;
  }
}; 