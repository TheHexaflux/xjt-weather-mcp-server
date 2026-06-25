export interface LiveWeather {
  province?: string;
  city?: string;
  adcode?: string;
  weather?: string;
  temperature?: string;
  winddirection?: string;
  windpower?: string;
  humidity?: string;
  reporttime?: string;
}

export interface ForecastCast {
  date?: string;
  week?: string;
  dayweather?: string;
  nightweather?: string;
  daytemp?: string;
  nighttemp?: string;
  daywind?: string;
  nightwind?: string;
  daypower?: string;
  nightpower?: string;
}

export interface ForecastWeather {
  city?: string;
  adcode?: string;
  province?: string;
  reporttime?: string;
  casts?: ForecastCast[];
}

export interface AmapWeatherResponse {
  status: string;
  count: string;
  info: string;
  infocode: string;
  lives?: LiveWeather[];
  forecasts?: ForecastWeather[];
}

export type AmapWeatherExtensions = 'base' | 'all';
