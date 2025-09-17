import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { generateTestCases } from "./geminiClient.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const output = await generateTestCases(prompt);

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch {
      return res.status(500).json({ error: "Model did not return valid JSON", raw: output });
    }

    // 🔑 Normalize keys to avoid "Priority" vs "priority" issues
    const cleanedCases = parsed.map(tc => ({
      id: tc.id || "",
      title: tc.title || "",
      preconditions: tc.preconditions || tc.Preconditions || "",
      steps: tc.steps || tc.Steps || "",
      expectedResult: tc.expectedResult || tc.ExpectedResult || "",
      priority: tc.priority || tc.Priority || ""
    }));

    res.json({ testCases: cleanedCases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
