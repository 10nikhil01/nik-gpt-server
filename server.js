import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const sessions = {};

// ✅ Allow only your frontend
const allowedOrigins = ['https://niqai.in', 'https://nik-gpt.vercel.app'];

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
if (!process.env.OPEN_ROUTER_API_KEY) {
  console.error("❌ OPEN_ROUTER_API_KEY missing!");
  return res.status(500).json({ error: "Server misconfigured. API key missing." });
}

// ✅ Health Check Route
app.get('/', (req, res) => {
  res.send({ message: '🟢 NIQ AI Server is running' });
});

// ✅ Chat Route
app.post("/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = [
      { role: "system", content: "You are NIQ AI, created by Nikhil." },
    ];
  }
  sessions[sessionId].push({ role: "user", content: message });

  const predefinedReplies = [
    {
      keywords: ["who are you", "your identity", "what are you"],
      reply: "I'm NIQ AI created by Nikhil.",
    },
    {
      keywords: ["your name", "what's your name", "what is ur name", "what is your name"],
      reply: "My name is NIQ AI , created by Nikhil.",
    },
    {
      keywords: ["who made you", "who created you", "who build you"],
      reply: "I was developed by Nikhil using models.",
    },
    {
      keywords: ["what can you do"],
      reply: "I can answer your questions, explain concepts, and more.",
    },
  ];

  const getPredefinedReply = (message) => {
    const lowerPrompt = message.trim().toLowerCase();
    for (const item of predefinedReplies) {
      if (item.keywords.some((k) => lowerPrompt.includes(k))) {
        return item.reply;
      }
    }
    return null;
  };

  const predefined = getPredefinedReply(message);
  if (predefined) return res.json({ reply: predefined });

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-5",
      max_tokens: 400,
      messages: sessions[sessionId],
    });

    const reply = completion.choices[0]?.message?.content || "No response";
    sessions[sessionId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});











