const OLLAMA_URL = "http://localhost:11434";
const MODEL = "leetcode-coach:latest";

// Non-streaming version
export async function chat(messages) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}

// Streaming version. Used for the chat endpoint
// This function takes a WritableStream (the Express response) and pipes chunks to it
// The frontend receives text token by token as it's generated
export async function chatStream(messages, onChunk, onDone) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  // Ollama streams newline-delimited JSON
  // Each line is a JSON object like: { "message": { "content": "Hello" }, "done": false }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode the chunk and split by newlines (multiple JSON objects can arrive together)
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const token = parsed.message?.content ?? "";

        if (token) {
          fullContent += token;
          onChunk(token); // send token to frontend
        }

        if (parsed.done) {
          onDone(fullContent); // save to DB
        }
      } catch {
        // Partial JSON line. Skip it, next chunk will complete it
      }
    }
  }
}
