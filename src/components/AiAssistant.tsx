import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Trash2, 
  User, 
  Bot, 
  ArrowRight, 
  CheckCircle,
  TrendingDown,
  Info
} from "lucide-react";
import { ChatMessage, Transaction, Budget, SavingsGoal, Task, CalendarEvent } from "../types";

interface AiAssistantProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  expenses: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  monthlyIncome: number;
  tasks: Task[];
  events: CalendarEvent[];
}

export default function AiAssistant({
  chatHistory,
  setChatHistory,
  expenses,
  budgets,
  savingsGoals,
  monthlyIncome,
  tasks,
  events,
}: AiAssistantProps) {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "groq">(() => (localStorage.getItem("ai_provider") as any) || "gemini");
  
  // User provided API Keys
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("user_gemini_api_key") || "");
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem("user_groq_api_key") || "");

  const bottomRef = useRef<HTMLDivElement>(null);

  // Synchronize keys and chosen provider when localStorage is modified elsewhere (e.g. from the new Settings page)
  useEffect(() => {
    const handleSync = () => {
      setGeminiApiKey(localStorage.getItem("user_gemini_api_key") || "");
      setGroqApiKey(localStorage.getItem("user_groq_api_key") || "");
      setProvider((localStorage.getItem("ai_provider") as any) || "gemini");
    };
    
    window.addEventListener("storage_keys_updated", handleSync);
    return () => window.removeEventListener("storage_keys_updated", handleSync);
  }, []);

  // Auto-scroll chat to latest messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  // Suggested quick-prompt pills for immediate audit
  const starterPrompts = [
    { label: "💰 Overall Savings viability check", text: "Evaluate my savings rate and list which goals are easily reachable or need deeper cash infusions based on current spending." },
    { label: "📊 Category budget analysis", text: "Analyze my monthly transaction limits. What are my highest spending risk categories right now?" },
    { label: "💡 Spending cut tips of $250", text: "Give me 5 creative, practical actions to cut $250 from my food and subscriptions based on my current timeline list." },
    { label: "📅 Upcoming bill alignment", text: "Can you review my scheduled tasks and events on the calendar and highlight any potential cash shortages?" }
  ];

  // Submit chat query to the server
  const handleSubmitQuery = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const activeKey = provider === "gemini" ? geminiApiKey : groqApiKey;
    if (!activeKey || !activeKey.trim()) {
      const warningMsg: ChatMessage = {
        id: "msg_warning_" + Date.now(),
        role: "assistant",
        content: `🔑 **API Key Required**: Please enter your personal **${
          provider === "gemini" ? "Google Gemini" : "Groq Llama"
        } API Key** in the **Advisor Intelligence** sidebar settings to utilize the AI Financial Companion.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((p) => [...p, warningMsg]);
      return;
    }

    // Save user's question to the list
    const userMsg: ChatMessage = {
      id: "msg_" + Date.now() + "_u",
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setUserInput("");
    setIsLoading(true);

    // Contextual Financial info block for model grounding
    const financialSummaryCtx = {
      expenses,
      budgets,
      savingsGoals,
      monthlyIncome,
      tasks,
      events,
    };

    try {
      const resp = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          financialData: financialSummaryCtx,
          provider: provider,
          userApiKey: activeKey,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Advisor API responded with failure");
      }

      const data = await resp.json();

      const aiMsg: ChatMessage = {
        id: "msg_" + Date.now() + "_ai",
        role: "assistant",
        content: data.text || "I processed your financial state but was unable to formulate a concrete response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      // Construct explanation modal/message
      const errorMsg: ChatMessage = {
        id: "msg_error_" + Date.now(),
        role: "assistant",
        content: `🚨 **AI Advisor Error**: ${err.message || "Failed to generate AI insights"}.\n\nPlease double check that your entered API key is correct and active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChatHistory = () => {
    setChatHistory([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am your AI Finance Companion. I have fully indexed your monthly checkout registers, allowances, saving horizons, and schedule tasks. Ask me anything about category spending optimizations, cash forecasting, or goals viability!",
        timestamp: "09:00 AM",
      }
    ]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs grid grid-cols-1 lg:grid-cols-4 min-h-[580px]" id="assistant-parent">
      
      {/* SIDEBAR GROUNDING TIPS */}
      <div className="border-r border-slate-100 dark:border-slate-800 bg-slate-55 dark:bg-slate-950/50 p-5 flex flex-col justify-between" id="assistant-sidebar">
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" /> Advisor Intelligence
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Activate the AI with your personal API Key.
            </p>
          </div>

          {/* ACTIVE LLM ENGINE CONFIGURATION BADGE */}
          <div className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
            <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Active LLM Engine:
            </span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {provider === "gemini" ? "🌌 Google Gemini 3.5" : "⚡ Groq Llama 4 Scout"}
              </span>
              {((provider === "gemini" && geminiApiKey) || (provider === "groq" && groqApiKey)) ? (
                <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse">
                  Key Missing
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-sans leading-relaxed">
              To swap backend engines, configure custom API keys, or toggle display settings, please transition to the <strong className="font-semibold text-slate-600 dark:text-slate-355">Settings</strong> workspace panel.
            </p>
          </div>

          {/* REAL TIME CONTEXT SUMMARY */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/85 space-y-2 text-xs" id="grounding-parameters">
            <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Active Indexes in prompt:</span>
            
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
              <span>Payroll Pool:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">${monthlyIncome.toFixed(0)}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
              <span>Checkout volume:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">${expenses.reduce((s, e) => s + e.amount, 0).toFixed(0)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
              <span>Defined caps:</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">{budgets.length} indices</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
              <span>Goal milestone:</span>
              <span className="font-bold text-green-700 dark:text-emerald-400">{savingsGoals.length} targets</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 leading-normal flex items-start gap-1 pb-4">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
            <span>AI advisor references current records. Adding transactions or adjusting target dates updates its memory instantly.</span>
          </div>
        </div>

        <button
          onClick={handleClearChatHistory}
          className="text-xs font-mono text-slate-400 dark:text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 w-full py-1.5 border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Wipe Chat Index
        </button>
      </div>

      {/* CHAT CONTAINER */}
      <div className="lg:col-span-3 p-6 flex flex-col justify-between" id="assistant-chat-panel">
        
        {/* MESSAGE LOGS */}
        <div className="flex-1 space-y-4 max-h-[380px] overflow-y-auto mb-6 pr-1" id="chat-messages-container">
          
          {chatHistory.map((message) => {
            const isUser = message.role === "user";
            
            return (
              <div 
                key={message.id} 
                className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 rounded-xl h-fit flex-shrink-0 flex items-center justify-center ${
                  isUser ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble Body */}
                <div>
                  <div className={`rounded-2xl p-3.5 text-xs border whitespace-pre-wrap leading-relaxed ${
                    isUser 
                      ? "bg-slate-900 dark:bg-indigo-950 border-slate-950 dark:border-indigo-900 text-white font-medium" 
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}>
                    {message.content}
                  </div>
                  <span className={`block text-[8px] font-mono text-slate-400 mt-1 ${isUser ? "text-right" : "text-left"}`}>
                    {message.timestamp}
                  </span>
                </div>

              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-[80%] items-center" id="advisor-agent-loading-tick">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 animate-pulse">Finance Companion is calculating cash runways...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT FORM AND STARTER PROMPTS PILLS */}
        <div className="space-y-4">
          
          {/* STARTERS PILLS (Only shown if last message is assistant greeting) */}
          {chatHistory.length < 3 && (
            <div className="space-y-1.5" id="starter-query-palette">
              <span className="text-[9px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
                Select a quick diagnosis hook:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {starterPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmitQuery(p.text)}
                    className="text-left bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 p-2 text-[10px] text-slate-600 dark:text-slate-400 hover:text-indigo-900 dark:hover:text-indigo-200 rounded-xl transition-all font-medium truncate flex items-center justify-between cursor-pointer"
                  >
                    <span>{p.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CORE CHAT BAR */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitQuery(userInput);
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full text-xs p-3.5 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-2xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-655 focus:outline-none"
              placeholder="Ask for spending optimization advice or type a budgeting problem..."
            />
            <button
              id="btn-chat-submit"
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl p-3.5 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Submit finance question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
