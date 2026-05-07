# Jim's Log (SMS & AI Delivery)

## Date: 2026-05-07

### Tasks Completed
- **Template Engine:** Built `src/server/services/templateEngine.js` to compile raw database metrics (Risk, Temp, NDVI) into readable English digests and Red Alerts.
- **Gemini 1.5 Flash Translation:** Integrated the Gemini SDK to translate English templates into the farmer's registered dialect (Tagalog, Ilocano, Cebuano, Hiligaynon) while keeping messages concise and agronomic.
- **Gemini 1.5 Pro Chatbot:** Built the RAG (Retrieval-Augmented Generation) system prompt that injects real-time farm data into the AI so the Chatbot gives specific, accurate advice rather than generic answers.
- **Semaphore SMS Dispatch:** Developed `smsService.js` to handle external payload transmission to the Semaphore API. 
- **Graceful Fallback:** Added mocking logic so if the Semaphore or Gemini API keys are missing, the system prints the SMS to the terminal instead of crashing.
- **PANAHON Webhook:** Implemented the `POST /api/panahon` listener so Semaphore can forward inbound SMS commands to our server for processing.

### Issues Encountered
- **160-Character Limit:** Translating complex agronomic advice into local dialects often exceeded the standard SMS character limit, resulting in multi-part SMS charges.
  - *Fix:* Engineered the Gemini system prompt to strictly enforce the 160-character limit and prioritize urgent action items over pleasantries.

### Notes
- The delivery layer is fully isolated from the processing layer. It only reads from the DB cache, ensuring our SMS response times are under 5 seconds.
