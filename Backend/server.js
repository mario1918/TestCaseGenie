import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { generateTestCases } from "./geminiClient.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  try {
    const { 
      prompt, 
      existing_test_cases = [], 
      is_additional_generation = false, 
      summary = '', 
      issue_key = '',
      conversation_history = []
    } = req.body;
    
    const output = await generateTestCases({
      prompt,
      existing_test_cases,
      is_additional_generation,
      summary,
      issue_key,
      conversation_history
    });

    let parsed;
    try {
      parsed = JSON.parse(output);
      // Ensure we're always working with an array
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
    } catch (error) {
      console.error('Error parsing model output:', output);
      return res.status(500).json({ 
        error: "Model did not return valid JSON", 
        raw: output 
      });
    }

    // Normalize keys and clean up test cases
    const cleanedCases = parsed.map(tc => {
      // Handle steps whether they come as array or string
      let steps = '';
      if (Array.isArray(tc.steps)) {
        // Convert array of steps to numbered string
        steps = tc.steps
          .map((step, index) => `${index + 1}. ${step}`)
          .join('\n');
      } else {
        // Use steps as is if it's already a string
        steps = tc.steps || '';
      }

      // If it's already in the correct format, return as is
      if (tc.testCase || tc.description) {
        return {
          id: tc.id || Date.now().toString(),
          title: tc.testCase || '',
          description: tc.description || '',
          preconditions: tc.preconditions || '',
          steps: steps,
          expectedResult: tc.expectedResult || '',
          priority: tc.priority || 'Medium'
        };
      }
      
      // Legacy format support
      return {
        id: tc.id || Date.now().toString(),
        title: tc.title || tc.testCase || '',
        description: tc.description || '',
        preconditions: tc.preconditions || tc.Preconditions || '',
        steps: steps,
        expectedResult: tc.expectedResult || tc.ExpectedResult || '',
        priority: (tc.priority || tc.Priority || 'Medium').toString()
      };
    });

    // Add conversation history to the response
    const response = {
      testCases: cleanedCases,
      conversation_history: [
        ...(conversation_history || []),
        {
          role: 'assistant',
          content: JSON.stringify(cleanedCases)
        }
      ]
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
