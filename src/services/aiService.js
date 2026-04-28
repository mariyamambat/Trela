const GEMINI_MODEL = "gemini-2.0-flash";

const buildPrompt = (destination, days, currency, context = {}) => `Generate a ${days}-day travel itinerary for ${destination}.
Trip currency for any cost hints: ${currency}.
Attractions to prioritize: ${(context.attractions || []).map((p) => p.name).join(", ") || "Use popular local attractions"}.
Weather context: ${context.weatherSummary || "No weather data available"}.
Packing context: ${context.packingSummary || "General packing advice"}.
Return ONLY a JSON array, no explanation, no markdown, no code fences, just raw JSON like this:
[
  {
    "date": "Day 1",
    "label": "Day 1 - ${destination}",
    "activities": [
      { "time": "9:00 AM", "title": "Activity name", "location": "Place name", "notes": "Short tip" }
    ]
  }
]
Generate exactly ${days} day objects. Keep activities geographically sensible when possible.`;

export const generateItinerary = async (destination, days, currency, context = {}) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(destination, days, currency, context) }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || response.statusText || "Gemini API request failed";
    throw new Error(msg);
  }

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Prompt blocked: ${blockReason}`);
  }

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text).join("") : "";
  if (!text) {
    throw new Error("Unexpected response from AI (no text content).");
  }

  const clean = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }

  const jsonMatch = clean.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("AI did not return a JSON array.");
  }
  return JSON.parse(jsonMatch[0]);
};
