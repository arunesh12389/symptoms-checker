const express = require('express');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

const querySchema = new mongoose.Schema({
    symptoms: { type: String, required: true },
    analysis: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Query = mongoose.model('Query', querySchema);

const systemPrompt = `
You are an advanced AI medical assistant. Your task is to analyze user-provided symptoms and return a structured JSON object.

**JSON Schema:**
{
  "summary": "A brief, one-sentence summary of the most likely cause.",
  "conditions": [
    {
      "name": "Condition Name (e.g., Influenza (The Flu))",
      "match": "Strong Match | Possible Match | Unlikely Match",
      "description": "A concise explanation of why the symptoms match this condition."
    }
  ],
  "refineSymptoms": [
    {
      "condition": "Condition Name",
      "symptoms": ["related symptom 1", "related symptom 2", "+ another symptom"]
    }
  ],
  "nextSteps": [
    "A numbered list of clear, actionable next steps. Start with simple home care and escalate to seeking medical attention if necessary."
  ],
  "disclaimer": "This is for informational purposes only and is not a substitute for professional medical advice. Always consult a healthcare provider for any health concerns."
}

**Instructions:**
1.  Analyze the user's symptoms.
2.  Populate the JSON object according to the schema.
3.  Provide at least 2-3 potential 'conditions'.
4.  For 'refineSymptoms', suggest additional, distinct symptoms for each condition that would help confirm a diagnosis.
5.  Provide at least 4-5 'nextSteps'.
6.  The 'disclaimer' must be exactly as written in the schema.
7.  **IMPORTANT**: Do not include any text, markdown, or explanations outside of the JSON object. Your entire response must be only the JSON object.
`;

app.post('/api/symptoms', async (req, res) => {
    const { symptoms } = req.body;

    if (!symptoms) {
        return res.status(400).json({ error: 'Symptoms are required.' });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `My symptoms are: ${symptoms}` },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const analysisContent = chatCompletion.choices[0]?.message?.content;
        
        if (!analysisContent) {
            throw new Error("No analysis could be generated from the AI model.");
        }

        let analysis;
        try {
            analysis = JSON.parse(analysisContent);
        } catch (parseError) {
             console.error('JSON parsing error:', parseError);
             return res.status(500).json({ error: 'Failed to process the AI response. It was not valid JSON.' });
        }


        const newQuery = new Query({ symptoms, analysis });
        await newQuery.save();

        res.status(201).json({ analysis });

    } catch (error) {
        console.error('Error with Groq API or Database:', error);
        res.status(500).json({ error: 'Failed to get a response from the AI model.' });
    }
});

app.get('/api/symptoms', async (req, res) => {
    try {
        const queries = await Query.find().sort({ createdAt: -1 }).limit(20);
        res.status(200).json(queries);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Could not retrieve query history.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

