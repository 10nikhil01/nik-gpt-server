import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://nik-gpt.vercel.app',
  credentials: true,
}));
app.use(express.json());

// ✅ Handle preflight request
app.options('/', cors());

// ✅ OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://nik-gpt.vercel.app',
    'X-Title': 'Nik Gpt',
  },
});

// ✅ Health check
app.get('/', (req, res) => {
  res.send({ message: 'Hello from Nik’s AI Server via OpenRouter!' });
});

// ✅ POST /chat
app.post('/', async (req, res) => {
  const { prompt } = req.body;

  const predefinedReplies = [
    { keywords: ["who are you", "your identity", "what are you"], reply: "I'm an AI chatbot created by Nikhil." },
    { keywords: ["your name", "what's your name"], reply: "My name is NikhilBot, created by Nikhil." },
    { keywords: ["who made you", "who created you", "who build you"], reply: "I was developed by Nikhil using OpenAI's models." },
    { keywords: ["what can you do"], reply: "I can answer your questions, explain concepts, and more." },
  ];

  function getPredefinedReply(prompt) {
    const lowerPrompt = prompt.trim().toLowerCase();
    for (const item of predefinedReplies) {
      if (item.keywords.some(k => lowerPrompt.includes(k))) {
        return item.reply;
      }
    }
    return null;
  }

  const predefined = getPredefinedReply(prompt);
  if (predefined) return res.json({ reply: predefined });

  try {
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-pro-1.5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = completion.choices[0]?.message?.content || 'No response';
    res.json({ reply });
  } catch (error) {
    console.error('OpenRouter API error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 Server is running at http://localhost:${PORT}`);
});
