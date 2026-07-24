const SENTIMENT_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
];
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGenerationConfig(model) {
  const config = {
    maxOutputTokens: 32,
    temperature: 0,
  };

  if (model.startsWith("gemini-2.5-")) {
    config.thinkingConfig = {
      thinkingBudget: 0,
    };
    return config;
  }

  config.thinkingConfig = {
    thinkingLevel: "MINIMAL",
  };
  return config;
}

async function analyzeSentiment(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const input = String(text || "").trim();

  if (!apiKey || !input) {
    return null;
  }

  try {
    const prompt = `Classify the sentiment of this customer testimonial as exactly one word: 'positive', 'neutral', or 'negative'. Return only the single word, nothing else.\n\nTestimonial: "${input.substring(0, 500)}"`;
    for (const model of SENTIMENT_MODELS) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const body = JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: buildGenerationConfig(model),
        });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error(
            `[Sentiment] Gemini API error (${model}, attempt ${attempt}):`,
            JSON.stringify(result)
          );

          if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < 2) {
            await sleep(600 * attempt);
            continue;
          }

          break;
        }

        const label = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

        if (label === "positive" || label === "neutral" || label === "negative") {
          return label;
        }

        console.error(
          `[Sentiment] Invalid Gemini sentiment label (${model}):`,
          JSON.stringify(result)
        );
        break;
      }
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
