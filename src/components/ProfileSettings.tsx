import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Key, 
  ShieldCheck, 
  Bell, 
  Sun, 
  Moon, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  Trash2, 
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Terminal,
  Settings
} from "lucide-react";
import { User } from "firebase/auth";

interface ProfileSettingsProps {
  user: User | null;
  encryptionPin: string;
  theme: "light" | "dark";
  toggleTheme: () => void;
  notificationPermission: "default" | "granted" | "denied";
  requestDesktopPermission: () => Promise<void>;
  onTriggerWipeDatabase: () => void;
}

export default function ProfileSettings({
  user,
  encryptionPin,
  theme,
  toggleTheme,
  notificationPermission,
  requestDesktopPermission,
  onTriggerWipeDatabase,
}: ProfileSettingsProps) {
  // Key state management
  const [provider, setProvider] = useState<"gemini" | "groq">(() => (localStorage.getItem("ai_provider") as any) || "gemini");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("user_gemini_api_key") || "");
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem("user_groq_api_key") || "");

  // Key Visibility toggles
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  // Copy indicator
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Trigger test desktop notification
  const handleTestNotification = () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setTestStatus("❌ Desktop alerts not supported by this browser.");
      return;
    }

    if (Notification.permission === "granted") {
      try {
        new Notification("PocketBook Premium Settings", {
          body: "Verification alert: Desktop alerts are working flawlessly! 🚀",
        });
        setTestStatus("✅ Test alert dispatched!");
        setTimeout(() => setTestStatus(null), 3500);
      } catch (err) {
        setTestStatus("❌ Failed to dispatch notification. Try enabling standard system settings.");
      }
    } else if (Notification.permission === "denied") {
      setTestStatus("❌ Alerts are blocked by your browser configurations.");
    } else {
      setTestStatus("🔔 Please click 'Enable Desktop Alerts' first.");
    }
  };

  const copyToClipboard = (text: string, type: "uid" | "pin") => {
    navigator.clipboard.writeText(text);
    if (type === "uid") {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  // Sync back to localStorage when keys change
  const handleProviderChange = (val: "gemini" | "groq") => {
    setProvider(val);
    localStorage.setItem("ai_provider", val);
    // Dispatch custom event to notify other components (e.g. AiAssistant)
    window.dispatchEvent(new Event("storage_keys_updated"));
  };

  const handleGeminiChange = (val: string) => {
    setGeminiKey(val);
    localStorage.setItem("user_gemini_api_key", val.trim());
    // Dispatch custom event to notify other components (e.g. AiAssistant)
    window.dispatchEvent(new Event("storage_keys_updated"));
  };

  const handleGroqChange = (val: string) => {
    setGroqKey(val);
    localStorage.setItem("user_groq_api_key", val.trim());
    // Dispatch custom event to notify other components (e.g. AiAssistant)
    window.dispatchEvent(new Event("storage_keys_updated"));
  };

  const cleanEmail = user?.email || "anonymous@pocketbook.ai";
  const userInitials = cleanEmail.substring(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" id="profile-settings-page">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs uppercase tracking-widest font-bold">
            <Settings className="w-3.5 h-3.5" /> Workspace Control Room
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Profile & Security Settings
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
            Configure system configurations, personal custom LLM provider credentials, desktop warning preferences, and encryption modules.
          </p>
        </div>
        
        {/* Connection status card */}
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="text-left font-mono">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block uppercase leading-tight tracking-wider">SECURE LINK STATUS</span>
            <span className="text-[8px] text-emerald-600 dark:text-emerald-500 block lowercase">fully encrypted tunnel</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: USER INFORMATION CARD */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xs relative overflow-hidden flex flex-col items-center text-center">
            {/* Ambient pattern */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 dark:from-indigo-950/20 dark:to-pink-950/20" />
            
            {/* Profile Avatar */}
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-violet-500 rounded-full flex items-center justify-center text-white font-extrabold text-2xl shadow-md border-4 border-white dark:border-slate-900 relative z-10 mt-6 select-none shadow-indigo-200 dark:shadow-none">
              {userInitials}
            </div>

            <div className="mt-4 relative z-10">
              <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100/40 dark:border-indigo-900/40">
                Premium Core User
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 truncate max-w-[200px]" title={cleanEmail}>
                {cleanEmail}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                PocketBook Client v2026.05
              </p>
            </div>

            {/* Separator */}
            <div className="w-full border-t border-slate-100 dark:border-slate-800/50 my-5" />

            <div className="w-full text-left space-y-4">
              {/* UID */}
              <div>
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-550 block uppercase tracking-wider">Account Firebase ID</span>
                <div className="flex items-center justify-between gap-1 mt-1 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                    {user?.uid || "N/A"}
                  </span>
                  <button
                    onClick={() => user?.uid && copyToClipboard(user.uid, "uid")}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Copy unique account ID"
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Zero-Knowledge PIN */}
              <div>
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-550 block uppercase tracking-wider">Active Encryption Salt</span>
                <div className="flex items-center justify-between gap-1 mt-1 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>AES-PIN: <strong className="font-bold text-slate-800 dark:text-slate-200">{encryptionPin}</strong></span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(encryptionPin, "pin")}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Copy encryption pin"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed font-sans">
                  Used client-side for hybrid end-to-end local index hashing. Keep it guarded!
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-slate-100/50 dark:bg-slate-900/40 border border-slate-220/20 dark:border-slate-800 rounded-3xl p-5 font-mono text-[10px] space-y-2">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">Session Diagnostic</span>
            <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-1.5">
              <span className="text-slate-500">Local Status:</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">Authorized</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-1.5">
              <span className="text-slate-500">Security Mode:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">AES Client-Edge</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sync Scope:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Firestore Sync</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREFERENCES & KEYS CONFIGURATIONS */}
        <div className="md:col-span-2 space-y-6">
          
          {/* AI LLM CONFIGURATION KEYS CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">API Keys Console</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">Synchronize model capabilities with your private credentials</p>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl flex items-start gap-3 mb-5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                <strong className="font-bold">Privacy Centered Architecture:</strong> Your API keys are strictly retained locally on this machine using <code className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded text-[10px]">localStorage</code>. They are sent inside requests to the server edge during prompt generations, but are kept isolated and are never stored in databases.
              </div>
            </div>

            <div className="space-y-4">
              {/* ACTIVE MODEL ENGINE PICKER */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Active AI Companion Engine:
                </span>
                <div className="flex gap-2.5">
                  <button
                    id="settings-provider-gemini"
                    type="button"
                    onClick={() => handleProviderChange("gemini")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      provider === "gemini" 
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    🌌 Google Gemini
                  </button>
                  <button
                    id="settings-provider-groq"
                    type="button"
                    onClick={() => handleProviderChange("groq")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      provider === "groq" 
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ⚡ Groq Llama
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-sans leading-normal">
                  Toggle your preferred AI backend provider. Only the key for your active engine is required; the other will remain completely optional.
                </p>
              </div>

              {/* GOOGLE GEMINI KEY INPUT BOX */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Google Gemini API Key
                  </label>
                  {provider !== "gemini" ? (
                    <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded">Optional</span>
                  ) : !geminiKey ? (
                    <span className="text-[9px] font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 px-1.5 py-0.5 rounded animate-pulse font-bold">Required for Active AI</span>
                  ) : (
                    <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Active Engine Key</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showGemini ? "text" : "password"}
                    placeholder="AIzaSy... (Enter your personal Gemini API Key)"
                    value={geminiKey}
                    onChange={(e) => handleGeminiChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-750 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 font-mono pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal pl-1">
                  Enables smart financial analysis, budget anomaly matching, and tailored savings planning. Obtain a key free from Google AI Studio.
                </p>
              </div>

              {/* GROQ KEY INPUT BOX */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" /> Groq AI Model Key
                  </label>
                  {provider !== "groq" ? (
                    <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded">Optional</span>
                  ) : !groqKey ? (
                    <span className="text-[9px] font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-450 px-1.5 py-0.5 rounded animate-pulse font-bold">Required for Active AI</span>
                  ) : (
                    <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Active Engine Key</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showGroq ? "text" : "password"}
                    placeholder="gsk_... (Enter your personal Groq API Key to enable Llama-4 models)"
                    value={groqKey}
                    onChange={(e) => handleGroqChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-750 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 font-mono pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroq(!showGroq)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal pl-1">
                  Unlocks Groq's high-speed Llama-4-Scout logic options for comparing ledger items and calendar listings.
                </p>
              </div>        </div>

            </div>

          {/* APPLICATION INTERFACE & ALERTS CONFIGURATION CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-xl text-pink-600 dark:text-pink-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">Interface & Desktop Alerts</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">Manage alerts system permissions and look settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Alert Permissions card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/70 flex flex-col justify-between whitespace-normal">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    🔔 Browser Desktop Warnings
                  </h4>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-550 mt-1 leading-relaxed">
                    Receive alert updates in the background when calendar lists are reached or task lists are outstanding.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500">Alert status:</span>
                    {notificationPermission === "granted" ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                        ● Enabled
                      </span>
                    ) : notificationPermission === "denied" ? (
                      <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-100/40 dark:bg-rose-950/20 px-2 py-0.5 rounded-md">
                        ● Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100/50 dark:bg-slate-850 px-2 py-0.5 rounded-md">
                        Default
                      </span>
                    )}
                  </div>
                  
                  {notificationPermission !== "granted" && (
                    <button
                      onClick={requestDesktopPermission}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer mt-1"
                    >
                      🔔 Request Desktop Permission
                    </button>
                  )}

                  <button
                    onClick={handleTestNotification}
                    className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Test Desktop Notification
                  </button>

                  {testStatus && (
                    <span className="text-[9.5px] font-mono text-center block text-slate-500 dark:text-slate-400 mt-1">
                      {testStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Theme preference card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/70 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />} Theme Preferences
                  </h4>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-550 mt-1 leading-relaxed">
                    Set default workspace color mode filters. Choose an eye-friendly twilight dark theme or simple crisp light layout.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500">Current display:</span>
                    <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-100/40 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
                      {theme} mode
                    </span>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-755 text-white dark:text-slate-100 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer mt-1 flex items-center justify-center gap-1.5"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-400" /> Convert to Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-400" /> Convert to Light Mode
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* DANGER DESTRUCTION AREA */}
          <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-450">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-700 dark:text-rose-350">Data Security & Erasure Console</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">DANGER ZONE: Irreversible action block</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/40 p-4 border border-rose-100 dark:border-rose-950/50 rounded-2xl">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Wipe Server Sandbox & Local Storage</p>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-md">
                  Wipes your cloud Firestore document node database, empty savings ledgers, task reminders, note pages, custom logs, and clear system metadata immediately.
                </p>
              </div>
              <button
                onClick={onTriggerWipeDatabase}
                className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> Wipe Ledger Space
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
