import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();

// ✅ Allow only your frontend
const allowedOrigins = ['https://niqai.in'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// ✅ Referrer-Policy
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// ✅ OpenRouter AI Setup
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://niqai.in',
    'X-Title': 'NIQ AI',
  },
});

// ✅ Health Check Route
app.get('/', (req, res) => {
  res.send({ message: '🟢 NIQ AI Server is running' });
});

// ✅ Chat Route (no session)
app.post('/chat', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // ✅ Predefined replies
  const predefinedReplies = [
    { keywords: ["who are you", "your identity", "what are you"], reply: "I'm NIQ AI created by Nikhil." },
    { keywords: ["your name", "what's your name"], reply: "My name is NIQ AI, created by Nikhil." },
    { keywords: ["who made you", "who created you", "who build you"], reply: "I was developed by Nikhil using models." },
    { keywords: ["what can you do"], reply: "I can answer your questions, explain concepts, and more." },
  ];

  const getPredefinedReply = (prompt: string) => {
    const lowerPrompt = prompt.trim().toLowerCase();
    for (const item of predefinedReplies) {
      if (item.keywords.some(k => lowerPrompt.includes(k))) {
        return item.reply;
      }
    }
    return null;
  };

  const predefined = getPredefinedReply(prompt);
  if (predefined) return res.json({ reply: predefined });

  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3.1:free',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = completion.choices?.[0]?.message?.content || 'No response';
    res.json({ reply });
  } catch (error) {
    console.error('❌ OpenAI Error:', error);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});


