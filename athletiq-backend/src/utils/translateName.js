const { TranslationServiceClient } = require("@google-cloud/translate").v3;

// Instantiate Google Cloud Translation client
const translationClient = new TranslationServiceClient();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = "global"; // or your preferred location

/**
 * Translate text from sourceLang to targetLang using Google Translation API
 * @param {string} text
 * @param {string} sourceLang e.g. "ne" for Nepali, "en" for English
 * @param {string} targetLang e.g. "en", "ne"
 * @returns {Promise<string>} translated text
 */
async function translateName(text, sourceLang, targetLang) {
  if (!text) return text;

  try {
    const request = {
      parent: `projects/${projectId}/locations/${location}`,
      contents: [text],
      mimeType: "text/plain",
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };

    const [response] = await translationClient.translateText(request);
    return response.translations[0].translatedText;
  } catch (err) {
    console.error("Translation API error:", err);
    // fallback to original text on error
    return text;
  }
}

module.exports = { translateName };
