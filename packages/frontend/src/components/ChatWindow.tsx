import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import Markdown from "react-markdown";
import { sendMessage, endSession, type Turn } from "../lib/api";

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface Props {
  sessionId: number;
  initialTurns?: Turn[];
  onSessionEnd: () => void;
}

export function ChatWindow({
  sessionId,
  initialTurns = [],
  onSessionEnd,
}: Props) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // streamingContent holds the AI response as it's being built token by token
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  async function handleEndSession(didSolve: boolean) {
    setIsEnding(true);
    try {
      await endSession(sessionId, didSolve);
      onSessionEnd();
    } finally {
      setIsEnding(false);
    }
  }

  // Auto-scroll to bottom whenever turns or streaming content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, streamingContent]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    // Optimistically add user message to UI immediately
    // Don't wait for the server response to show the user's message
    setTurns((prev) => [
      ...prev,
      {
        id: Date.now(),
        session_id: sessionId,
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    let accumulated = "";

    await sendMessage(
      sessionId,
      userMessage,
      // onToken: append each token to the streaming display
      (token) => {
        accumulated += token;
        setStreamingContent(accumulated);
      },
      // onDone: move the completed response into turns, clear the stream
      () => {
        setTurns((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            session_id: sessionId,
            role: "assistant",
            content: accumulated,
            created_at: new Date().toISOString(),
          },
        ]);
        setStreamingContent("");
        setIsLoading(false);
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput((prev) =>
          prev ? prev + " " + finalTranscript : finalTranscript,
        );
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            <p className="text-lg">Start by describing your initial approach</p>
            <p className="text-sm mt-1">
              Don't worry about getting it right, think out loud
            </p>
          </div>
        )}

        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
              max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${
                turn.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-700 text-slate-100 rounded-bl-sm"
              }
            `}
            >
              {turn.role === "assistant" && (
                <p className="text-xs text-slate-400 mb-1 font-medium">
                  AI Coach
                </p>
              )}
              <div className="prose prose-invert prose-sm max-w-none">
                <Markdown>{turn.content}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming response, shown while AI is typing */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-slate-700 text-slate-100">
              <p className="text-xs text-slate-400 mb-1 font-medium">
                AI Coach
              </p>
              <div className="prose prose-invert prose-sm max-w-none">
                <Markdown>{streamingContent}</Markdown>
              </div>
              <span className="inline-block w-1.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* End session bar */}
      <div className="border-t border-slate-700 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Ready to finish?</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleEndSession(false)}
            disabled={isEnding}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-50"
          >
            End Session
          </button>
          <button
            onClick={() => handleEndSession(true)}
            disabled={isEnding}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
          >
            ✓ Solved It
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening... speak now"
                : "Describe your thinking... (Enter to send, Shift+Enter for new line)"
            }
            rows={4}
            disabled={isLoading}
            className={`flex-1 bg-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-50 ${
              isListening
                ? "focus:ring-red-500 ring-2 ring-red-500"
                : "focus:ring-blue-500"
            }`}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`rounded-xl p-3 transition-colors ${
                isListening
                  ? "bg-red-500 hover:bg-red-400 text-white animate-pulse"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
