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

console.log("Gemini raw response:", JSON.stringify(data));

let reply = "Sorry, I could not understand.";

if (
  data &&
  data.candidates &&
  data.candidates.length > 0 &&
  data.candidates[0].content &&
  data.candidates[0].content.parts &&
  data.candidates[0].content.parts.length > 0 &&
  data.candidates[0].content.parts[0].text
) {
  reply = data.candidates[0].content.parts[0].text;
}

res.json({ reply });
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});