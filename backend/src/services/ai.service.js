const { GoogleGenAI, Type } = require('@google/genai');

// Initialize the Google Gen AI client. It automatically picks up GEMINI_API_KEY from process.env
const ai = new GoogleGenAI({});

/**
 * Extracts structured data from a meeting transcript using Gemini.
 * Enforces JSON output matching the required schema.
 * 
 * @param {string} transcriptText - The raw transcript text.
 * @returns {Promise<Object>} The structured output { summary, actionItems, decisions }
 */
const extractMeetingData = async (transcriptText) => {
  const prompt = `Analyze the following meeting transcript carefully.
Extract a concise summary of the discussion, a list of actionable tasks (assigning an owner and deadline if they are mentioned), and a list of key decisions made.

Transcript:
"""
${transcriptText}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING,
              description: "A concise summary of the meeting."
            },
            actionItems: {
              type: Type.ARRAY,
              description: "List of actionable tasks.",
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING, description: "The action item description." },
                  owner: { type: Type.STRING, description: "Who is responsible. Default to 'Unassigned' if not mentioned." },
                  deadline: { type: Type.STRING, description: "When it is due. Leave empty string if not mentioned." }
                },
                required: ["task"]
              }
            },
            decisions: {
              type: Type.ARRAY,
              description: "List of key decisions made during the meeting.",
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "actionItems", "decisions"]
        }
      }
    });

    // response.text is guaranteed to be a JSON string matching the schema
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw new Error(`Failed to extract meeting data using AI: ${error.message}`);
  }
};

module.exports = { extractMeetingData };
