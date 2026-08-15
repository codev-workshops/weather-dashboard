export interface Location {
  latitude: number;
  longitude: number;
  cityName?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  condition: WeatherCondition;
  sunrise: number;
  sunset: number;
  timestamp: number;
  visibility: number;
  pressure: number;
  windDeg: number;
  cloudiness: number;
}

export interface HourlyForecast {
  hours: HourlyWeather[];
}

export interface HourlyWeather {
  time: number;
  temperature: number;
  icon: string;
  description: string;
}

export interface DailyWeather {
  date: number;
  tempMin: number;
  tempMax: number;
  icon: string;
  description: string;
  condition: WeatherCondition;
  humidity: number;
  windSpeed: number;
  pop: number;
}

export interface DailyForecast {
  days: DailyWeather[];
}

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'mist';
export type TemperatureUnit = 'metric' | 'imperial';
