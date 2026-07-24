async function analyzeSentiment(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const input = String(text || "").trim();

  if (!apiKey || !input) {
    return null;
  }

  try {
    const prompt = `Classify the sentiment of this customer testimonial as exactly one word: 'positive', 'neutral', or 'negative'. Return only the single word, nothing else.\n\nTestimonial: "${input.substring(0, 500)}"`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0,
          },
        }),
      }
    );

    const result = await response.json();
    const label = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

    if (label === "positive" || label === "neutral" || label === "negative") {
      return label;
    }

    return null;
  } catch (err) {
    console.error("[Sentiment] Failed:", err.message);
    return null;
  }
}

module.exports = {
  analyzeSentiment,
};
