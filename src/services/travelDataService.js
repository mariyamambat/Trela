const GEOAPIFY_GEOCODE_URL = "https://api.geoapify.com//geocode/";
const GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places";
const OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const safeNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

const getGeoapifyCoordinates = async (destination, apiKey) => {
  const url =
    `${GEOAPIFY_GEOCODE_URL}?text=${encodeURIComponent(destination)}` +
    `&type=city&format=json&limit=1&apiKey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  const data = await response.json();
  const result = Array.isArray(data?.results) ? data.results[0] : null;
  if (!response.ok || !result) {
    throw new Error(data?.message || "Geoapify geocoding failed");
  }
  return result;
};

export const getTopAttractions = async (destination) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return [];

  const coords = await getGeoapifyCoordinates(destination, apiKey);
  const lon = coords.lon;
  const lat = coords.lat;
  const url =
    `${GEOAPIFY_PLACES_URL}?categories=tourism.sights,tourism.attraction,entertainment,leisure.park` +
    `&filter=circle:${lon},${lat},25000&bias=proximity:${lon},${lat}&limit=8` +
    `&apiKey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Geoapify places request failed");
  }

  const features = Array.isArray(data?.features) ? data.features : [];
  return features.map((feature) => {
    const p = feature.properties || {};
    return {
      name: p.name || p.address_line1 || p.formatted || "Attraction",
      address: p.formatted || "",
      rating: safeNum(p?.rank?.popularity),
      location: feature.geometry?.coordinates
        ? { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }
        : null,
    };
  });
};

const getCoordinates = async (destination, apiKey) => {
  const url = `${OPENWEATHER_GEO_URL}?q=${encodeURIComponent(destination)}&limit=1&appid=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || !Array.isArray(data) || !data[0]) {
    throw new Error("Could not geocode destination for weather.");
  }
  return data[0];
};

export const getWeatherInsights = async (destination) => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();
  if (!apiKey) return null;

  const coords = await getCoordinates(destination, apiKey);
  const query = `lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${encodeURIComponent(apiKey)}`;

  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${OPENWEATHER_CURRENT_URL}?${query}`),
    fetch(`${OPENWEATHER_FORECAST_URL}?${query}`),
  ]);

  const [current, forecast] = await Promise.all([currentRes.json(), forecastRes.json()]);
  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error("OpenWeather request failed.");
  }

  const forecastList = Array.isArray(forecast.list) ? forecast.list : [];
  const nextTemps = forecastList.slice(0, 12).map((f) => f?.main?.temp).filter((t) => typeof t === "number");
  const rainSlots = forecastList.filter((f) => (f?.pop || 0) >= 0.5).length;
  const avgTemp = nextTemps.length ? nextTemps.reduce((a, b) => a + b, 0) / nextTemps.length : null;

  let bestTime = "Weather looks fairly stable for sightseeing this week.";
  if (avgTemp !== null) {
    if (avgTemp >= 30) bestTime = "Plan outdoor activities early morning or late evening to avoid peak heat.";
    if (avgTemp < 12) bestTime = "Midday is usually the most comfortable time for outdoor plans.";
  }
  if (rainSlots > 2) bestTime = "Expect rain windows; keep indoor backup attractions in your plan.";

  const packing = [];
  if (avgTemp !== null && avgTemp >= 28) packing.push("Light breathable clothes");
  if (avgTemp !== null && avgTemp <= 15) packing.push("A warm layer or light jacket");
  if (rainSlots > 0) packing.push("Umbrella or rain jacket");
  if (packing.length === 0) packing.push("Comfortable walking shoes");

  return {
    locationLabel: `${coords.name}${coords.country ? `, ${coords.country}` : ""}`,
    current: {
      tempC: safeNum(current?.main?.temp),
      description: current?.weather?.[0]?.description || "",
      humidity: safeNum(current?.main?.humidity),
    },
    bestTimeToVisit: bestTime,
    packingSuggestions: packing,
  };
};

export const buildDirectionsUrl = (origin, destination) => {
  if (!origin || !destination) return "";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
};
