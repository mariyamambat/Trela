const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const fmtInr = (n) => Math.round(n).toLocaleString("en-IN");

const buildFallbackPlan = ({ startingLocation, destination, days }) => {
  const dayCount = Math.max(1, Number(days) || 1);
  const itinerary = Array.from({ length: dayCount }, (_, idx) => {
    const day = idx + 1;
    return {
      day,
      morning: `Breakfast near your stay in ${destination}, then visit a major local landmark.`,
      afternoon: `Explore neighborhoods, local food spots, and one cultural attraction in ${destination}.`,
      evening: `Relax with a sunset viewpoint and dinner at a popular local restaurant.`,
    };
  });

  return {
    tripOverview: {
      summary: `${dayCount}-day trip from ${startingLocation} to ${destination} with sightseeing, food, and balanced pacing.`,
    },
    itinerary,
    budgetEstimate: {
      stay: `Approx ₹${fmtInr(6500 * dayCount)} to ₹${fmtInr(15000 * dayCount)} total`,
      food: `Approx ₹${fmtInr(1600 * dayCount)} to ₹${fmtInr(3800 * dayCount)} total`,
      travel: `Approx ₹${fmtInr(2500 * dayCount)} to ₹${fmtInr(10000 * dayCount)} total (local + intercity)`,
    },
    _error: "",
    _isFallback: true,
  };
};

const requireGeminiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const message = "Missing VITE_GEMINI_API_KEY. Add it to .env and restart Vite.";
    console.error(message);
    throw new Error(message);
  }
  return apiKey;
};

export const generateItinerary = async ({ startingLocation, destination, days }) => {
  const apiKey = requireGeminiKey();

  try {
    const prompt = `You are a travel planner. Create a JSON object for a ${days}-day trip from ${startingLocation} to ${destination}.
Return valid JSON only with this exact shape:
{
  "tripOverview": {
    "summary": "string"
  },
  "itinerary": [
    {
      "day": 1,
      "morning": "string",
      "afternoon": "string",
      "evening": "string"
    }
  ],
  "budgetEstimate": {
    "stay": "string",
    "food": "string",
    "travel": "string"
  }
}
Include practical tips and realistic activities.
For budgetEstimate, use Indian Rupees only: give approximate total-trip ranges with the ₹ symbol and en-IN style thousands separators (e.g. ₹12,000), suitable for a mid-range traveler.`;

    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Gemini request failed.");
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      throw new Error("Gemini returned an empty itinerary.");
    }

    const clean = text.replace(/```json|```/g, "").trim();

    // First attempt: direct parse
    try {
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === "object") {
        return {
          tripOverview: { summary: parsed?.tripOverview?.summary || "" },
          itinerary: Array.isArray(parsed?.itinerary) ? parsed.itinerary : [],
          budgetEstimate: {
            stay: parsed?.budgetEstimate?.stay || "",
            food: parsed?.budgetEstimate?.food || "",
            travel: parsed?.budgetEstimate?.travel || "",
          },
          _error: "",
        };
      }
    } catch {
      // fall through to extraction
    }

    // Fallback: extract first JSON object from mixed text
    const objectMatch = clean.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const parsed = JSON.parse(objectMatch[0]);
      return {
        tripOverview: { summary: parsed?.tripOverview?.summary || "" },
        itinerary: Array.isArray(parsed?.itinerary) ? parsed.itinerary : [],
        budgetEstimate: {
          stay: parsed?.budgetEstimate?.stay || "",
          food: parsed?.budgetEstimate?.food || "",
          travel: parsed?.budgetEstimate?.travel || "",
        },
        _error: "",
      };
    }

    throw new Error("Gemini returned invalid JSON for itinerary.");
  } catch (error) {
    console.error("generateItinerary failed:", error);
    const fallback = buildFallbackPlan({ startingLocation, destination, days });
    return {
      ...fallback,
      _error: `${error?.message || "Failed to generate itinerary"} (using fallback plan)`,
    };
  }
};
