import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header using user-provided API key
const getGeminiClient = (apiKey: string) => {
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API endpoint for financial advisor
app.post("/api/advisor", async (req, res) => {
  try {
    const { messages, financialData, provider, userApiKey } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (!userApiKey || !userApiKey.trim()) {
      return res.status(400).json({
        error_code: "API_KEY_REQUIRED",
        error: `Please provide your personal ${provider === "groq" ? "Groq" : "Gemini"} API Key in the AI Settings panel first to unlock AI financial advice.`
      });
    }

    const apiKey = userApiKey.trim();

    // Format financial data context
    let contextPrompt = "You are a highly skilled personal financial advisor and budgeting companion. Your tone is supportive, analytical, practical, and highly clear.\n\n";
    
    if (financialData) {
      const { expenses, savingsGoals, monthlyIncome, budgets, tasks, events, tags } = financialData;
      
      const totalIncome = monthlyIncome || 0;
      const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const activeGoalsCount = (savingsGoals || []).length;
      const remainingBudgets = totalIncome - totalExpenses;

      contextPrompt += `--- USER FINANCIAL PROFILE ---\n`;
      contextPrompt += `- Current Monthly Income: $${totalIncome.toFixed(2)}\n`;
      contextPrompt += `- Total Recorded Expenses: $${totalExpenses.toFixed(2)}\n`;
      contextPrompt += `- Remaining Income: $${remainingBudgets.toFixed(2)}\n`;
      contextPrompt += `- Custom Tags Available: ${(tags || []).join(", ") || "None yet"}\n`;
      
      if (budgets && budgets.length > 0) {
        contextPrompt += `\nMonthly Budgets Setting:\n`;
        budgets.forEach((b: any) => {
          contextPrompt += `  * ${b.category}: limit $${b.limit} (Spent so far: $${b.spent || 0})\n`;
        });
      }

      if (savingsGoals && savingsGoals.length > 0) {
        contextPrompt += `\nSavings Goals:\n`;
        savingsGoals.forEach((g: any) => {
          contextPrompt += `  * ${g.name}: Target $${g.target} (Current Saved: $${g.current || 0}, Target Date: ${g.targetDate || "N/A"})\n`;
        });
      }

      if (expenses && expenses.length > 0) {
        contextPrompt += `\nRecent Transactions:\n`;
        expenses.slice(0, 15).forEach((e: any) => {
          contextPrompt += `  * [${e.date || "N/A"}] $${e.amount} in '${e.category}' | Tag: ${e.tag || "None"} | Notes: ${e.notes || "None"}\n`;
        });
      }

      if (tasks && tasks.length > 0) {
        contextPrompt += `\nTasks (To-Dos):\n`;
        tasks.slice(0, 10).forEach((t: any) => {
          contextPrompt += `  * ${t.title} [Status: ${t.completed ? "Completed" : "Pending"}] (Due: ${t.dueDate || "N/A"})\n`;
        });
      }

      if (events && events.length > 0) {
        contextPrompt += `\nImportant Financial Events / Calendar:\n`;
        events.slice(0, 10).forEach((ev: any) => {
          contextPrompt += `  * ${ev.title} (Type: ${ev.type}) [Date: ${ev.date}] | Amount affected: $${ev.amount || 0}\n`;
        });
      }
      
      contextPrompt += `--------------------------------\n\n`;
    }

    contextPrompt += `Based on this data, provide helpful spending insights, savings goal viability, anomalies, smart suggestions, or answers to the user's questions. Always be supportive and encourage healthy saving habits. Focus on strict realism based on the user's data.\n`;

    if (provider === "groq") {
      const groqMessages = [
        { role: "system", content: contextPrompt },
        ...messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        }))
      ];

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-4-scout",
          messages: groqMessages,
          temperature: 0.7
        })
      });

      if (!groqResponse.ok) {
        const errText = await groqResponse.text();
        console.error("Groq response failed:", errText);
        return res.status(400).json({ error: `Groq API responded with error: ${groqResponse.statusText}. Please verify your Groq API key is valid.` });
      }

      const groqData: any = await groqResponse.json();
      const aiText = groqData.choices?.[0]?.message?.content || "No response received from Groq Llama 4 Scout.";
      return res.json({ text: aiText });
    }

    // Default: Gemini
    const ai = getGeminiClient(apiKey);
    if (!ai) {
      return res.status(400).json({ error: "Invalid API key or cannot initialize Gemini client." });
    }

    // Package the history for the model
    const messageHistory = messages.map((m: any) => {
      return {
        role: m.role === "user" ? "user" : "assistant",
        parts: [{ text: m.content }],
      };
    });

    // We can prepend the context prompt as a system instruction
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: messageHistory as any,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
      },
    });

    const aiText = response.text || "I was unable to compile a recommendation at this moment.";
    res.json({ text: aiText });
  } catch (error: any) {
    console.error("Error in AI advisor endpoint:", error);
    res.status(500).json({ error: "Failed to generate AI insights. Check server logs." });
  }
});

// Setup Vite Dev server or Serve Static files from /dist
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded in server.ts");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static elements from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
