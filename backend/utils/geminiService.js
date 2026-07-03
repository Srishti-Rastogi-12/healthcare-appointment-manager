const { GoogleGenAI } = require('@google/genai');

// Initialize the Google Gen AI SDK with your environment API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes patient symptoms using Gemini 2.5 Flash
 * @param {string} symptomsText - The raw symptoms text typed by the patient
 * @returns {Promise<Object>} Structured clinical assessment
 */
async function generatePreVisitSummary(symptomsText) {
  try {
    if (!symptomsText || !symptomsText.trim()) {
      return {
        urgency: "Low",
        chiefComplaint: "Routine checkup / No symptoms provided",
        suggestedQuestions: ["What brings you in for a checkup today?"]
      };
    }

    const prompt = `
      You are an expert clinical medical assistant. Analyze the following raw patient symptoms and generate a pre-visit summary structure for the doctor.
      
      Patient Symptoms: "${symptomsText}"
      
      You must respond with a valid JSON object matching this schema exactly:
      {
        "urgency": "Low" | "Medium" | "High",
        "chiefComplaint": "A concise, professional medical summary of the core complaint",
        "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
      }
      
      Provide nothing but the raw JSON object. Do not wrap it in markdown blocks or backticks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text.trim();
    return JSON.parse(responseText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      urgency: "Medium",
      chiefComplaint: "Symptom analysis unavailable due to service disruption",
      suggestedQuestions: [
        "Can you describe your symptoms in detail?",
        "When did these symptoms first start?"
      ]
    };
  }
}

/**
 * Generates a patient-friendly structured prescription from a doctor's raw clinical notes.
 * @param {string} rawNotes - Shorthand text from the doctor (e.g., "Amox 500mg tid x7d caps. Take w/ food.")
 * @returns {Object} Structured prescription matching our MongoDB Schema
 */
async function generatePatientPrescriptionAI(rawNotes) {
  try {
    const prompt = `
      You are an expert clinical AI assistant. Your task is to take a doctor's raw, rapid clinical notes/shorthand and transform them into a highly organized, clear, and patient-friendly digital prescription layout.

      Doctor's Raw Notes: "${rawNotes}"

      You must respond with a valid JSON object matching this exact structure:
      {
        "chiefComplaintConfirmation": "Brief summary of what condition is being treated based on the notes",
        "medications": [
          {
            "name": "Full, correct name of the medicine",
            "dosage": "Clear strength/amount (e.g., '500mg - 1 capsule')",
            "duration": "Length of treatment (e.g., '7 days')",
            "timing": "Clear translated clinical instructions (e.g., 'Three times a day, after meals')"
          }
        ],
        "patientNotes": "A warm, clear, jargon-free explanation to the patient explaining how this treatment helps them and general recovery advice.",
        "safetyWarnings": "Crucial safety warnings related to these specific drugs or general red flags to look out for (e.g., 'Do not consume alcohol', 'Seek emergency care if pain worsens drastically')."
      }

      Strict Guidelines:
      - Expand all medical shorthand accurately (e.g., 'tid' becomes 'Three times a day', 'qd' becomes 'Once daily', 'po' becomes 'By mouth', 'w/' becomes 'with').
      - Keep explanations completely clear and accessible to a non-medical person.
      - Return ONLY the raw JSON object. Do not wrap it in markdown blocks (like \`\`\`json) or add any extra prose text outside the JSON structure.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanText = response.text.trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Error generating prescription summary via Gemini:", error);
    return {
      chiefComplaintConfirmation: "Follow-up consultation treatment details.",
      medications: [],
      patientNotes: "The doctor has updated your clinical records. Please review medication packaging details directly.",
      safetyWarnings: "Contact your clinic immediately if you experience adverse side effects."
    };
  }
}

// Export both functions together clearly at the bottom!
module.exports = { 
  generatePreVisitSummary, 
  generatePatientPrescriptionAI 
};