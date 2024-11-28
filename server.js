require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

async function generateResponse(userMessage) {
  let botReply = "";
  let totalTokens = 0;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          { role: "user", content: userMessage },
          {
            role: "system",
            content:
              "Please provide a detailed and complete response, ensuring the answer makes sense and is finished.",
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
        top_p: 1,
        n: 1,
        stop: ["\n", ".", "?", "!"],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    botReply = response.data.choices[0].message.content.trim();
    totalTokens = response.data.usage.total_tokens;

    // Check if the reply is incomplete or cut off
    while (totalTokens < 160 && !botReply.match(/[.!?]$/)) {
      const followUpResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4-turbo",
          messages: [
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content:
                botReply +
                " Please finish the sentence and provide the complete information.",
            },
          ],
          max_tokens: 20,
          temperature: 0.8,
          top_p: 1,
          n: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const additionalResponse =
        followUpResponse.data.choices[0].message.content.trim();
      botReply += " " + additionalResponse;
      totalTokens += followUpResponse.data.usage.total_tokens;

      // Check if the sentence is complete
      if (botReply.match(/[.!?]$/)) {
        break;
      }
    }

    if (totalTokens > 160) {
      botReply = botReply.substring(0, 160);
    }

    return botReply;
  } catch (error) {
    console.error(error);
    return "Something went wrong. Please try again later.";
  }
}

app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const botReply = await generateResponse(userMessage);

    res.json({ reply: botReply });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
  }
});

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
