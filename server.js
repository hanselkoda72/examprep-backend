const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.json({ status: 'ExamPrep Backend Running ✅' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ALOC_BASE = 'https://questions.aloc.com.ng/api/v2';

app.get('/api/questions', async (req, res) => {
  try {
    const { subject, type = 'utme', year, count = 10 } = req.query;

    let url = `${ALOC_BASE}/m/${count}`;
    const params = new URLSearchParams({ subject, type });
    if (year && year !== 'Any Year') params.append('year', year);
    url += `?${params.toString()}`;

    console.log('Fetching ALOC:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': process.env.ALOC_API_KEY,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('ALOC response:', JSON.stringify(data).slice(0, 300));

    res.json(data);
  } catch (err) {
    console.error('ALOC error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/api/tutor', async (req, res) => {
  try {
    const { messages } = req.body;

    const groqMessages = [
      {
        role: 'system',
        content: "You are a friendly, encouraging tutor helping Nigerian secondary school students prepare for WAEC, JAMB/UTME, NECO and Post-UTME exams. Explain concepts simply with examples. Keep answers concise but clear. Use Nigerian curriculum context where relevant."
      },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }))
    ];

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.3-70b-versatile',
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, no response.";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));