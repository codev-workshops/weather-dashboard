import { CurrentWeather, HourlyForecast } from '../../models/weather.model';

export const MOCK_CURRENT_WEATHER: CurrentWeather = {
  temperature: 22,
  feelsLike: 20,
  humidity: 55,
  windSpeed: 3.5,
  description: 'clear sky',
  icon: '01d',
  condition: 'clear',
  sunrise: Math.floor(Date.now() / 1000) - 21600,
  sunset: Math.floor(Date.now() / 1000) + 21600,
  timestamp: Math.floor(Date.now() / 1000),
};

export const MOCK_HOURLY_FORECAST: HourlyForecast = {
  hours: Array.from({ length: 12 }, (_, i) => ({
    time: Math.floor(Date.now() / 1000) + i * 3600,
    temperature: 20 + Math.round(Math.sin(i / 3) * 4),
    icon: i < 6 ? '01d' : '01n',
    description: i < 6 ? 'clear sky' : 'few clouds',
  })),
};
