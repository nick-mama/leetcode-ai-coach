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
export async function chatStream(messages, onChunk, onDone) {
  const systemPrompt = messages.find((m) => m.role === "system")?.content ?? "";
  const filtered = messages.filter((m) => m.role !== "system");

  let fullContent = "";

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    ...(systemPrompt ? { system: systemPrompt } : {}),
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

  onDone(fullContent);
}
