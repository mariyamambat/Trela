const GEOAPIFY_GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";
const GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places";
const GEOAPIFY_ROUTE_URL = "https://api.geoapify.com/v1/routing";

const requireGeoapifyKey = () => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    const message = "Missing VITE_GEOAPIFY_API_KEY. Add it to .env and restart Vite.";
    console.error(message);
    throw new Error(message);
  }
  return apiKey;
};

const getCityCoordinates = async (city, apiKey) => {
  const url =
    `${GEOAPIFY_GEOCODE_URL}?text=${encodeURIComponent(city)}` +
    `&type=city&format=json&limit=1&apiKey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Geoapify geocoding request failed.");
  }

  const firstResult = data?.results?.[0];
  if (!firstResult) {
    throw new Error(`Could not find coordinates for "${city}".`);
  }

  return { lat: firstResult.lat, lon: firstResult.lon };
};

const pickTransportMode = (distanceKm) => {
  if (distanceKm <= 5) return "Walking / metro";
  if (distanceKm <= 120) return "Car or bus";
  if (distanceKm <= 700) return "Train";
  return "Flight";
};

export const getPlaces = async (city) => {
  const apiKey = requireGeoapifyKey();

  try {
    const { lat, lon } = await getCityCoordinates(city, apiKey);
    const url =
      `${GEOAPIFY_PLACES_URL}?categories=tourism.sights` +
      `&filter=circle:${lon},${lat},25000&bias=proximity:${lon},${lat}` +
      `&limit=10&apiKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Geoapify places request failed.");
    }

    const features = Array.isArray(data?.features) ? data.features : [];
    return features
      .map((feature) => {
        const properties = feature?.properties || {};
        const coordinates = feature?.geometry?.coordinates || [];
        const name = (properties.name || properties.address_line1 || "").trim();
        const address = (properties.formatted || "").trim();

        return {
          name,
          address,
          rating: null,
          lat: typeof coordinates[1] === "number" ? coordinates[1] : null,
          lon: typeof coordinates[0] === "number" ? coordinates[0] : null,
        };
      })
      .filter((place) => place.name && place.address);
  } catch (error) {
    console.error("getPlaces failed:", error);
    return [];
  }
};

export const getTripOverview = async (startingLocation, destination) => {
  const apiKey = requireGeoapifyKey();
  try {
    const [from, to] = await Promise.all([
      getCityCoordinates(startingLocation, apiKey),
      getCityCoordinates(destination, apiKey),
    ]);

    const url =
      `${GEOAPIFY_ROUTE_URL}?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}` +
      `&mode=drive&details=distance&apiKey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Geoapify route request failed.");
    }

    const firstRoute = Array.isArray(data?.features) ? data.features[0] : null;
    const distanceMeters = firstRoute?.properties?.distance ?? 0;
    const timeSeconds = firstRoute?.properties?.time ?? 0;
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const travelHours = Math.round((timeSeconds / 3600) * 10) / 10;

    return {
      distanceKm,
      travelHours,
      bestTransport: pickTransportMode(distanceKm),
    };
  } catch (error) {
    console.error("getTripOverview failed:", error);
    return {
      distanceKm: null,
      travelHours: null,
      bestTransport: "",
    };
  }
};

export const searchCities = async (query) => {
  const apiKey = requireGeoapifyKey();
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const url =
      `${GEOAPIFY_GEOCODE_URL}?text=${encodeURIComponent(trimmed)}` +
      `&type=city&format=json&limit=8&apiKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Geoapify city search failed.");
    }

    const results = Array.isArray(data?.results) ? data.results : [];
    return results.map((item) => ({
      name: item.city || item.name || item.formatted || "",
      label: item.formatted || item.city || item.name || "",
    }));
  } catch (error) {
    console.error("searchCities failed:", error);
    return [];
  }
};
