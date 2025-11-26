import fetch from "node-fetch";
import { GemminiResponse } from "../types/interfaces";


export async function askGemmini(
  apiKey: string,
  prompt: string,
  context = "",
  workspaceTree = "",
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  if (!apiKey) {
    throw new Error("No Gemmini API key configured. Set gemminiAi.apiKey in settings.");
  }

  let userMessage = prompt;

  if (context) {
    userMessage += `\n\nThe following is the relevant code context:\n\`\`\`\n${context}\n\`\`\``;
  }

  if (workspaceTree) {
    userMessage += `\n\n${workspaceTree}`;
  }

  userMessage += "\n\nPlease respond with an improved or modified version as appropriate.";

  const systemPrompt = `You are a helpful coding assistant that edits and improves code.
You have access to the following tools:

1. READ_FILE: <path>
   - Use this to read the content of a file when you need more context.
   - Example: READ_FILE: src/utils.ts

2. WRITE_FILE: <path>
   - Use this to create or update a file.
   - Follow this line immediately with a code block containing the new content.
   - Example:
     WRITE_FILE: src/utils.ts
     \`\`\`typescript
     export function add(a, b) { return a + b; }
     \`\`\`

If you need to read a file, output ONLY the READ_FILE command.
If you need to write a file, output the WRITE_FILE command and the code block.
Otherwise, just answer the user's question.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: userMessage }
  ];

  const body = {
    model: "gemini-2.5-flash",
    messages
  };

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("[Gemmini] API error response:", txt);
      throw new Error(`Gemmini API error ${res.status}: ${txt}`);
    }

    const data: GemminiResponse = await res.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("[Gemmini] Response OK, chars:", content?.length || 0);
    return content ?? JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("[Gemmini] Request failed:", err);
    throw err;
  }
}
