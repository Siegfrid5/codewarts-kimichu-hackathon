/**
 * GABAYANI — Gemini Service
 * 
 * Integration with Google Gemini (Flash/Pro) for:
 * 1. SMS Translation (English template -> Local Dialect + Agronomic tone)
 * 2. Chatbot interface (RAG over farm risk status)
 */

const config = require('../config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getAI() {
  if (!genAI) {
    if (!config.gemini.apiKey || config.gemini.apiKey === 'your-gemini-api-key') {
      console.warn('⚠️  Gemini API key not configured. Using MOCK translation.');
      return null;
    }
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAI;
}

const GeminiService = {
  /**
   * Translate an English SMS template into a localized, agronomic dialect.
   * Uses gemini-1.5-flash for speed.
   * 
   * @param {string} englishTemplate 
   * @param {string} dialect - e.g., 'tagalog', 'ilocano', 'cebuano'
   * @returns {string} Translated SMS
   */
  async translateForSms(englishTemplate, dialect = 'tagalog') {
    const ai = getAI();
    
    // Mock fallback
    if (!ai) {
      if (dialect.toLowerCase() === 'tagalog') {
        return `[MOCK TAGALOG] ${englishTemplate}`;
      }
      return englishTemplate;
    }

    try {
      // Flash is perfect for quick translations
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are an expert Filipino agronomist. 
        Translate the following English SMS alert into natural, conversational ${dialect}.
        It is for a rice farmer. Keep it concise, actionable, and under 160 characters if possible.
        Retain the "[GABAYANI]" prefix.
        
        Message to translate:
        "${englishTemplate}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('❌ [Gemini] Translation failed:', err.message);
      // Fallback to English on error so the alert still goes out
      return englishTemplate;
    }
  },

  /**
   * Chat with the Farm Consultant AI.
   * Uses gemini-1.5-pro for deep agronomic reasoning.
   * 
   * @param {string} userMessage 
   * @param {Object} farmContext - The farm's current risk/weather state
   * @returns {string} AI response
   */
  async consult(userMessage, farmContext) {
    const ai = getAI();
    if (!ai) {
      return "I am currently offline (API key not configured). Please check back later!";
    }

    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const systemContext = `
        You are 'Gabayani', an AI agricultural consultant for Filipino rice farmers.
        Be respectful, practical, and highly knowledgeable about tropical rice farming (PhilRice/IRRI standards).
        Respond in the farmer's dialect: ${farmContext.dialect}.
        
        CURRENT FARM CONTEXT:
        - Location: ${farmContext.barangay}, ${farmContext.municipality}
        - Weather: ${farmContext.weather?.temp_c}°C, Humidity: ${farmContext.weather?.humidity_pct}%
        - Rainfall (1h): ${farmContext.weather?.rain_1h_mm}mm
        - BPH Risk: ${farmContext.risk_status?.bph_risk}
        - Blast Risk: ${farmContext.risk_status?.blast_risk}
        - Flood Risk: ${farmContext.risk_status?.flood_risk}
      `;

      const prompt = `${systemContext}\n\nFarmer says: "${userMessage}"\nGabayani:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('❌ [Gemini] Chatbot failed:', err.message);
      throw new Error('Chatbot unavailable');
    }
  }
};

module.exports = GeminiService;
