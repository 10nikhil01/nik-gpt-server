import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();

// ✅ Allow only your frontend
const allowedOrigins = ['https://niqai.in'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
}));

// ✅ Referrer-Policy
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(express.json());

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

// ✅ Chat Route
app.post('/chat', async (req, res) => {
  const { prompt } = req.body;

  const predefinedReplies = [
    { keywords: ["who are you", "your identity", "what are you"], reply: "I'm NIQ AI created by Nikhil." },
    { keywords: ["your name", "what's your name"], reply: "My name is NIQ AI , created by Nikhil." },
    { keywords: ["who made you", "who created you", "who build you"], reply: "I was developed by Nikhil using models." },
    { keywords: ["what can you do"], reply: "I can answer your questions, explain concepts, and more." },
  ];

  const getPredefinedReply = (prompt) => {
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

    const reply = completion.choices[0]?.message?.content || 'No response';
    res.json({ reply });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});



