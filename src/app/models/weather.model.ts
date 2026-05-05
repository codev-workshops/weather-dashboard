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

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'mist';
export type TemperatureUnit = 'metric' | 'imperial';
