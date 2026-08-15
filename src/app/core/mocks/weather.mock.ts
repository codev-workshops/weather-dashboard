import { CurrentWeather, DailyForecast, HourlyForecast } from '../../models/weather.model';

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
  visibility: 10000,
  pressure: 1013,
  windDeg: 220,
  cloudiness: 10,
};

export const MOCK_HOURLY_FORECAST: HourlyForecast = {
  hours: Array.from({ length: 12 }, (_, i) => ({
    time: Math.floor(Date.now() / 1000) + i * 3600,
    temperature: 20 + Math.round(Math.sin(i / 3) * 4),
    icon: i < 6 ? '01d' : '01n',
    description: i < 6 ? 'clear sky' : 'few clouds',
  })),
};

const CONDITIONS = ['clear', 'clouds', 'rain', 'clear', 'clouds'] as const;

export const MOCK_DAILY_FORECAST: DailyForecast = {
  days: Array.from({ length: 5 }, (_, i) => ({
    date: Math.floor(Date.now() / 1000) + i * 86400,
    tempMin: 16 + Math.round(Math.sin(i / 2) * 3),
    tempMax: 24 + Math.round(Math.cos(i / 2) * 4),
    icon: i % 2 === 0 ? '01d' : '02d',
    description: i % 2 === 0 ? 'clear sky' : 'scattered clouds',
    condition: CONDITIONS[i],
    humidity: 45 + i * 5,
    windSpeed: 2 + i * 0.8,
    pop: i * 0.15,
  })),
};
