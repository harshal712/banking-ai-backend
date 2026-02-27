require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  // Safety settings: Ensure it doesn't block helpful banking info
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1000,
  }
});

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Banking AI Backend: Online ✅");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // 1. Validation & Logging
  if (!message) {
    return res.status(400).json({ reply: "Message is required." });
  }
  console.log(`📩 User Message: ${message}`);

  try {
    // 2. System Prompt Definition
    const systemPrompt = `
      You are a helpful Indian banking assistant.
      User Profile: Rahul Sharma | Balance: ₹84,500 | Credit Score: 742
      Active EMI: Amazon iPhone EMI ₹2500 | Subscriptions: Netflix ₹499
      
      RULES:
      1. Detect the user's language (English/Hindi/Marathi) and reply in that same language.
      2. If asking for transfers, remind them: "Please enter your secure 6-digit PIN to continue."
      3. Keep it brief and professional.
    `;

    // 3. Generate Content
    const result = await model.generateContent([systemPrompt, message]);
    const response = await result.response;
    const text = response.text();

    // 4. Verification
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    console.log(`🤖 AI Response: ${text}`);
    res.json({ reply: text });

  } catch (err) {
    // 5. Robust Error Logging
    console.error("❌ Gemini API Error:", err.message);
    
    // Check if it's an API Key issue
    if (err.message.includes("API_KEY_INVALID")) {
      return res.status(401).json({ reply: "Backend Error: Invalid API Key." });
    }

    res.status(500).json({
      reply: "I'm having trouble connecting to my brain right now. Please try again!",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server stabilized on port ${PORT}`);
});