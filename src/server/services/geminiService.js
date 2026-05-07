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

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/__(.*?)__/g, '$1')     // Remove underline
    .replace(/_(.*?)_/g, '$1')       // Remove italic
    .replace(/~~(.*?)~~/g, '$1')     // Remove strikethrough
    .replace(/`([^`]+)`/g, '$1')     // Remove inline code
    .replace(/#+\s/g, '')            // Remove headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Replace links with text
    .trim();
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
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are an expert Filipino agronomist. 
        Translate the following English SMS alert into natural, conversational ${dialect}.
        It is for a rice farmer. Keep it concise, actionable, and under 160 characters if possible.
        Retain the "[GABAYANI]" prefix.
        IMPORTANT: Return PLAIN TEXT ONLY. DO NOT use markdown, bold text, or asterisks.
        
        Message to translate:
        "${englishTemplate}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return stripMarkdown(response.text());
    } catch (err) {
      console.error('❌ [Gemini] Translation failed:', err.message);
      // Fallback to English on error so the alert still goes out
      return stripMarkdown(englishTemplate);
    }
  },

  /**
   * Chat with the Farm Consultant AI.
   * Uses gemini-1.5-pro for deep agronomic reasoning.
   * 
   * @param {string} userMessage 
   * @param {Object} farmContext - The farm's current risk/weather/satellite state
   * @returns {string} AI response
   */
  async consult(userMessage, farmContext) {
    const ai = getAI();
    if (!ai) {
      return "I am currently offline (API key not configured). Please check back later!";
    }

    try {
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Build a rich pre-prompt with ALL available farm data
      const systemContext = `
        You are 'Gabayani', an AI agricultural consultant for Filipino rice farmers.
        Be respectful, practical, and highly knowledgeable about tropical rice farming (PhilRice/IRRI standards).
        Respond in the farmer's dialect: ${farmContext.dialect || 'tagalog'}.
        Keep responses concise but informative. Use simple lists instead of deep markdown.
        IMPORTANT: Return PLAIN TEXT ONLY. DO NOT use markdown formatting, bold text, or asterisks (*). Do not use hashtags (#). This will be sent directly via SMS.
        
        ═══════════════════════════════
        CURRENT FARM DATA (LIVE):
        ═══════════════════════════════
        
        📍 LOCATION:
        - Farmer: ${farmContext.farmer_name}
        - Barangay: ${farmContext.barangay}
        - Municipality: ${farmContext.municipality}
        - Crop: ${farmContext.crop || 'rice'}
        - Farm Area: ${farmContext.area_hectares ? farmContext.area_hectares + ' hectares' : 'Unknown'}
        - Coordinates: ${farmContext.centroid_lat || 'N/A'}, ${farmContext.centroid_lng || 'N/A'}
        - Elevation: ${farmContext.elevation_m ? farmContext.elevation_m + 'm above sea level' : 'Unknown'}
        - Slope: ${farmContext.slope_deg ? farmContext.slope_deg + '°' : 'Unknown'}
        
        🌦️ WEATHER (Real-time from OpenWeather):
        - Temperature: ${farmContext.weather?.temp_c ?? 'N/A'}°C
        - Humidity: ${farmContext.weather?.humidity_pct ?? 'N/A'}%
        - Rainfall (last 1hr): ${farmContext.weather?.rain_1h_mm ?? '0'}mm
        - Rainfall (last 24hr): ${farmContext.weather?.rain_24h_mm ?? 'N/A'}mm
        - Wind Speed: ${farmContext.weather?.wind_speed_mps ?? 'N/A'} m/s
        - Cloud Cover: ${farmContext.weather?.cloud_pct ?? 'N/A'}%
        - Weather Description: ${farmContext.weather?.description ?? 'N/A'}
        
        🛰️ SATELLITE DATA (from Google Earth Engine):
        - NDVI (Vegetation Index): ${farmContext.satellite?.ndvi ?? 'N/A'} (0-1 scale, higher = healthier crops)
        - NDWI (Water Index): ${farmContext.satellite?.ndwi ?? 'N/A'} (higher = more water stress)
        - Cloud Coverage: ${farmContext.satellite?.cloud_pct ?? 'N/A'}%
        
        ⚠️ RISK ASSESSMENT (computed by GABAYANI Risk Engine):
        - Brown Planthopper (BPH) Risk: ${farmContext.risk_status?.bph_risk ?? 'unknown'}
        - Rice Blast Disease Risk: ${farmContext.risk_status?.blast_risk ?? 'unknown'}
        - Flood Risk: ${farmContext.risk_status?.flood_risk ?? 'unknown'}
        - Growing Degree Days (GDD): ${farmContext.risk_status?.gdd_accumulated ?? 'N/A'}
        
        ═══════════════════════════════
        
        Use the above real-time data to give specific, actionable advice.
        When the farmer asks about their farm, reference the ACTUAL data above — do not make up numbers.
        If a risk level is "high", proactively warn and suggest preventive measures.
        If weather indicates rain, advise accordingly for their specific crop stage.
      `;

      const prompt = `${systemContext}\n\nFarmer says: "${userMessage}"\nGabayani:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return stripMarkdown(response.text());
    } catch (err) {
      console.error('❌ [Gemini] Chatbot failed:', err.message);
      throw new Error(err.message || 'Chatbot unavailable');
    }
  }
};

module.exports = GeminiService;
