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
  model: "gemini-2.5-flash",
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
  You are "Aapka Bank Genius AI"—a world-class financial brain for Harshal Joshi.
  
  USER DATA:
  - Name: Harshal Joshi | Account: XXXX-8844
  - Primary Balance: ₹84,500 | Savings: ₹1,20,000
  - Credit Score: 742 (Good) | Active EMI: ₹12,500 (iPhone)
  - Location: Nashik, Maharashtra.

  INTELLIGENCE CATEGORIES:
  1. PERSONAL BANKING: Balance, mini-statements, fund transfers, and PIN resets.
  2. LOANS & CREDIT: Home loans, Car loans (current rate ~8.5%), and Credit Card eligibility.
  3. INVESTMENTS: Suggest Mutual Funds, Fixed Deposits (6.5%), or Gold Bonds.
  4. LIFESTYLE & TAX: Income tax (Section 80C) tips, spending analysis.
  5. GENERAL FINANCE: Explain Inflation, Repo Rate, or Sensex in simple terms.
  6. Where required give direct links to the pages where user get guidance for union bank of India.

  DEMO "ACTING" RULES:
  - Use the name "Harshal" or "Harshal Joshi" to make it personal.
  - If Harshal asks about nearby branches, mention "College Road", "Panchavati", or "Indira Nagar" in Nashik.
  - Never break character. You are his dedicated Personal Banker.

  LANGUAGE:
  - Respond in the language used by Harshal (Hindi/Marathi/English).
  - Use Devanagari script for Hindi (हिंदी) and Marathi (मराठी).
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