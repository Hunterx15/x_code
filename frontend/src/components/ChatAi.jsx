import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Trash2, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  const suggestions = [
    "Give me a hint",
    "Explain optimal solution",
    "Analyze time complexity",
    "Find edge cases",
  ];

  const onSubmit = async (data) => {
    if (sending || !data.message?.trim()) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ text: data.message }],
    };

    const payloadMessages = [...messages, userMsg];

    setMessages(payloadMessages);
    reset();
    setSending(true);

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages: payloadMessages.slice(-20),
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "model",
          parts: [
            {
              text: response.data.message,
            },
          ],
        },
      ]);
    } catch (error) {
      console.error("API Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "model",
          parts: [
            {
              text:
                "❌ AI service unavailable.\n\nPlease try again in a few moments.",
            },
          ],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] rounded-xl border border-zinc-800 bg-[#0a0a0b] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#131316]">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            AI Problem Assistant
          </h3>
        </div>

        <button
          onClick={() => setMessages([])}
          className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <Sparkles size={32} className="text-blue-400 mb-3" />

            <h3 className="text-lg font-semibold text-zinc-100">
              Ask AI About This Problem
            </h3>

            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Get hints, debugging help, complexity analysis,
              edge cases, and solution explanations.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setValue("message", prompt)}
                  className="px-3 py-1.5 text-xs rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.parts[0].text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-xl px-4 py-3">
              <Loader2
                size={18}
                className="animate-spin text-zinc-400"
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-t border-zinc-800 p-4 bg-[#131316]"
      >
        <div className="flex gap-2">
          <textarea
            rows={1}
            placeholder="Ask for hints, debugging help, optimal solution..."
            className="flex-1 resize-none rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            {...register("message", {
              required: true,
              minLength: 2,
            })}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          />

          <button
            type="submit"
            disabled={sending || errors.message}
            className="px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50"
          >
            {sending ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;