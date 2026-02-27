const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.status(200).send("Banking AI backend running ✅");
});

// chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a helpful Indian banking assistant.

User data:
Name: Rahul Sharma
Balance: ₹84,500
Credit Score: 742
Active EMI: Amazon iPhone EMI ₹2500
Subscriptions: Netflix ₹499

Rules:
- Reply in user's language (Hindi/English/Marathi)
- Be simple and friendly
- If user asks for money transfer, ask for PIN

User question: ${userMessage}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiRes.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not understand.";

    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({
      reply: "AI service temporarily unavailable.",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});