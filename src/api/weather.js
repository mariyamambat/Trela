const OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const requireWeatherKey = () => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();
  if (!apiKey) {
    const message = "Missing VITE_OPENWEATHER_API_KEY. Add it to .env and restart Vite.";
    console.error(message);
    throw new Error(message);
  }
  return apiKey;
};

const getCoordinates = async (city, apiKey) => {
  const geoUrl =
    `${OPENWEATHER_GEO_URL}?q=${encodeURIComponent(city)}` +
    `&limit=1&appid=${encodeURIComponent(apiKey)}`;

  const geoResponse = await fetch(geoUrl);
  const geoData = await geoResponse.json();

  if (!geoResponse.ok) {
    throw new Error(geoData?.message || "OpenWeather geocoding request failed.");
  }

  const first = Array.isArray(geoData) ? geoData[0] : null;
  if (!first) {
    throw new Error(`Could not find weather coordinates for "${city}".`);
  }

  return { lat: first.lat, lon: first.lon };
};

export const getWeather = async (city) => {
  const apiKey = requireWeatherKey();

  try {
    const { lat, lon } = await getCoordinates(city, apiKey);
    const weatherUrl =
      `${OPENWEATHER_CURRENT_URL}?lat=${lat}&lon=${lon}` +
      `&units=metric&appid=${encodeURIComponent(apiKey)}`;

    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "OpenWeather current weather request failed.");
    }

    return {
      temperature: data?.main?.temp ?? null,
      description: data?.weather?.[0]?.description || "No description available",
    };
  } catch (error) {
    console.error("getWeather failed:", error);
    return null;
  }
};

export const getWeatherForecast = async (city) => {
  const apiKey = requireWeatherKey();

  try {
    const { lat, lon } = await getCoordinates(city, apiKey);
    const forecastUrl =
      `${OPENWEATHER_FORECAST_URL}?lat=${lat}&lon=${lon}` +
      `&units=metric&appid=${encodeURIComponent(apiKey)}`;

    const response = await fetch(forecastUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "OpenWeather forecast request failed.");
    }

    const groupedByDay = new Map();
    for (const entry of data?.list || []) {
      const dayKey = new Date(entry.dt * 1000).toISOString().slice(0, 10);
      if (!groupedByDay.has(dayKey)) groupedByDay.set(dayKey, []);
      groupedByDay.get(dayKey).push(entry);
    }

    const nextDays = [...groupedByDay.entries()].slice(0, 4).map(([date, entries]) => {
      const temps = entries.map((e) => e.main?.temp).filter((v) => typeof v === "number");
      const avgTemp =
        temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : null;
      const description = entries[0]?.weather?.[0]?.description || "No data";

      return {
        date,
        temperature: avgTemp,
        description,
      };
    });

    return nextDays;
  } catch (error) {
    console.error("getWeatherForecast failed:", error);
    return [];
  }
};
