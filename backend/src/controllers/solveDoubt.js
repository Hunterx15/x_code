// ---------------------------------------------------------------------------
// AI chat controller (Gemini-powered DSA tutor).
//
// Endpoint: POST /ai/chat
//
// BUG FIXES (this file):
//   1. Status code was 201 (Created) — chat doesn't create a resource.
//      Changed to 200 OK.
//   2. No validation of `messages` — if the client sent an empty array or
//      a non-array, the Gemini SDK would throw an opaque error. We now
//      validate up front and return 400.
//   3. `response.text` is a getter on the GenAI response object — but in
//      newer SDK versions it may be a method or undefined. We handle both.
//   4. Error response now returns JSON (was already JSON, but inconsistent
//      shape — now matches the centralized error shape `{ error, message }`).
//   5. The GoogleGenAI client was instantiated on every request (expensive).
//      We now cache it at module scope.
// ---------------------------------------------------------------------------

const { GoogleGenAI } = require("@google/genai");

// Cache the GenAI client at module scope so we don't re-instantiate it on
// every request (the constructor reads the API key and sets up HTTP clients).
let aiClient = null;
const getAiClient = () => {
  if (!aiClient) {
    if (!process.env.GEMINI_KEY) {
      throw new Error("GEMINI_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
  }
  return aiClient;
};

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;

    // Validate required fields.
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "messages is required and must be a non-empty array",
        message: "messages is required and must be a non-empty array",
      });
    }

    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title || "No title provided"}
[PROBLEM_DESCRIPTION]: ${description || "No description provided"}
[EXAMPLES]: ${testCases || "No test cases provided"}
[startCode]: ${startCode || "No starter code provided"}


## YOUR CAPABILITIES:
1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
2. **Code Reviewer**: Debug and fix code submissions with explanations
3. **Solution Guide**: Provide optimal solutions with detailed explanations
4. **Complexity Analyzer**: Explain time and space complexity trade-offs
5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)
6. **Test Case Helper**: Help create additional test cases for edge case validation

## INTERACTION GUIDELINES:

### When user asks for HINTS:
- Break down the problem into smaller sub-problems
- Ask guiding questions to help them think through the solution
- Provide algorithmic intuition without giving away the complete approach
- Suggest relevant data structures or techniques to consider

### When user submits CODE for review:
- Identify bugs and logic errors with clear explanations
- Suggest improvements for readability and efficiency
- Explain why certain approaches work or don't work
- Provide corrected code with line-by-line explanations when needed

### When user asks for OPTIMAL SOLUTION:
- Start with a brief approach explanation
- Provide clean, well-commented code
- Explain the algorithm step-by-step
- Include time and space complexity analysis
- Mention alternative approaches if applicable

### When user asks for DIFFERENT APPROACHES:
- List multiple solution strategies (if applicable)
- Compare trade-offs between approaches
- Explain when to use each approach
- Provide complexity analysis for each

## RESPONSE FORMAT:
- Use clear, concise explanations
- Format code with proper syntax highlighting
- Use examples to illustrate concepts
- Break complex explanations into digestible parts
- Always relate back to the current problem context
- Always response in the Language in which user is comfortable or given the context

## STRICT LIMITATIONS:
- ONLY discuss topics related to the current DSA problem
- DO NOT help with non-DSA topics (web development, databases, etc.)
- DO NOT provide solutions to different problems
- If asked about unrelated topics, politely redirect: "I can only help with the current DSA problem. What specific aspect of this problem would you like assistance with?"

## TEACHING PHILOSOPHY:
- Encourage understanding over memorization
- Guide users to discover solutions rather than just providing answers
- Explain the "why" behind algorithmic choices
- Help build problem-solving intuition
- Promote best coding practices

Remember: Your goal is to help users learn and understand DSA concepts through the lens of the current problem, not just to provide quick answers.
`,
      },
    });

    // `response.text` is a getter in current @google/genai versions, but
    // older versions exposed it as a method. Handle both defensively.
    const text =
      typeof response?.text === "function"
        ? response.text()
        : response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.status(200).json({ message: text });
  } catch (err) {
    console.error("AI chat error:", err?.message || err);
    res.status(500).json({
      error: "AI service unavailable",
      message: "AI service unavailable",
    });
  }
};

module.exports = solveDoubt;
