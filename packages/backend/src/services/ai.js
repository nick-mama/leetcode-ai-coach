import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-haiku-4-5-20251001";

// Non-streaming used for analysis and profile generation
export async function chat(messages) {
  const systemPrompt = messages.find((m) => m.role === "system")?.content ?? "";
  const filtered = messages.filter((m) => m.role !== "system");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: filtered.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return response.content[0].text;
}

// Streaming used for the coaching chat endpoint
export async function chatStream(messages, onChunk, onDone, onToolUse = null) {
  const systemPrompt = messages.find((m) => m.role === "system")?.content ?? "";
  const filtered = messages.filter((m) => m.role !== "system");

  // Only add detectSolved tool after 3+ user messages
  // Saves tokens on early messages where solving is impossible
  const userMessageCount = filtered.filter((m) => m.role === "user").length;
  const tools =
    userMessageCount >= 3
      ? [
          {
            name: "detectSolved",
            description:
              "Call this function when the student has demonstrated a correct and complete solution to the problem. Only call this when you are confident they understand the solution, not just when they write correct code.",
            input_schema: {
              type: "object",
              properties: {
                confidence: {
                  type: "string",
                  enum: ["high", "medium"],
                  description:
                    "How confident you are that the student has genuinely solved and understood the problem",
                },
                reason: {
                  type: "string",
                  description:
                    "Brief explanation of why you believe the student has solved the problem",
                },
              },
              required: ["confidence", "reason"],
            },
          },
        ]
      : [];

  let fullContent = "";

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    ...(tools.length > 0 ? { tools } : {}),
    messages: filtered.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      const token = chunk.delta.text;
      fullContent += token;
      onChunk(token);
    }
  }

  // Check final message for tool use
  const finalMessage = await stream.finalMessage();
  const toolUseBlock = finalMessage.content.find(
    (b) => b.type === "tool_use" && b.name === "detectSolved",
  );
  if (toolUseBlock && onToolUse) {
    onToolUse({
      tool: "detectSolved",
      input: toolUseBlock.input,
    });
  }

  onDone(fullContent);
}
