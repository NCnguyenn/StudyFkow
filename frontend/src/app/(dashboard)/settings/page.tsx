"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Key, Cpu, User, Sliders, Shield, Download, Trash2 } from "lucide-react";
import { fetchLlmSettings, updateLlmSettings } from "@/features/user_auth/api/settingsApi";
import { useAppStore } from "../../../store/useAppStore";
import { GlassCard } from "../../../components/ui/GlassCard";

export default function SettingsPage() {
  const [provider, setProvider] = useState<"OLLAMA" | "GEMINI" | "OPENAI">("OLLAMA");
  const [apiKey, setApiKey] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  // Zustand Store
  const { isLiteMode, isZenMode, soulColor, setLiteMode, setZenMode, setSoulColor } = useAppStore();

  useEffect(() => {
    let mounted = true;
    fetchLlmSettings()
      .then((settings) => {
        if (mounted) {
          setProvider(settings.provider);
          setApiKey(settings.api_key || "");
        }
      })
      .catch(() => {
        if (mounted) setMessage({ type: "error", text: "Failed to load settings." });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateLlmSettings({
        provider,
        api_key: apiKey.trim() === "" ? null : apiKey.trim()
      });
      setMessage({ type: "success", text: "Settings saved successfully." });
      // Trigger success glow
      setShowSuccessGlow(true);
      setTimeout(() => setShowSuccessGlow(false), 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    alert("Exporting Data from /auth/export...");
  };

  const handleClearCache = () => {
    localStorage.clear();
    alert("Local cache cleared. Please reload.");
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">Personalize your study experience and AI integrations.</p>
      </div>

      <GlassCard className={`space-y-8 transition-all duration-700 ${showSuccessGlow ? 'ring-2 ring-emerald-400/60 shadow-[0_0_30px_rgba(52,211,153,0.25)]' : ''}`}>
        {/* Section 1: Account */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 border-b border-white/20 pb-2">
            <User className="w-5 h-5 text-indigo-500" />
            Account Personalization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Display Name</label>
              <input 
                type="text" 
                placeholder="Your Name" 
                className="w-full px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl text-sm shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Soul Color</label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value={soulColor} 
                  onChange={(e) => setSoulColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent"
                />
                <span className="text-sm text-slate-500 uppercase">{soulColor}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Preferences */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 border-b border-white/20 pb-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            UI Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/30 rounded-xl border border-white/40 shadow-sm">
              <div>
                <p className="font-medium text-slate-800">Lite Mode / Battery Saver</p>
                <p className="text-sm text-slate-500">Disables heavy glassmorphism to save battery and GPU.</p>
              </div>
              <button 
                onClick={() => setLiteMode(!isLiteMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLiteMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLiteMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/30 rounded-xl border border-white/40 shadow-sm">
              <div>
                <p className="font-medium text-slate-800">Zen Mode</p>
                <p className="text-sm text-slate-500">Hides the sidebar for maximum focus.</p>
              </div>
              <button 
                onClick={() => setZenMode(!isZenMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isZenMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isZenMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: AI Configuration */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 border-b border-white/20 pb-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            AI Pipeline Configuration
          </h2>
          <form onSubmit={handleSave} className="space-y-6 bg-white/30 p-6 rounded-2xl border border-white/40 shadow-sm">
            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">LLM Provider</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors backdrop-blur-sm ${provider === "OLLAMA" ? "border-indigo-500 bg-white/60" : "border-white/50 bg-white/20 hover:bg-white/40"}`}>
                  <input type="radio" name="provider" value="OLLAMA" checked={provider === "OLLAMA"} onChange={() => setProvider("OLLAMA")} className="sr-only" />
                  <span className="flex flex-1 flex-col">
                    <span className={`block text-sm font-medium ${provider === "OLLAMA" ? "text-indigo-900" : "text-slate-800"}`}>Local (Ollama)</span>
                    <span className="mt-1 text-xs text-slate-500">Runs locally. Default model: llama3. 100% private.</span>
                  </span>
                  <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${provider === "OLLAMA" ? "border-indigo-500" : "border-slate-300"}`}>
                    {provider === "OLLAMA" && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />}
                  </span>
                </label>

                <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors backdrop-blur-sm ${provider === "GEMINI" ? "border-indigo-500 bg-white/60" : "border-white/50 bg-white/20 hover:bg-white/40"}`}>
                  <input type="radio" name="provider" value="GEMINI" checked={provider === "GEMINI"} onChange={() => setProvider("GEMINI")} className="sr-only" />
                  <span className="flex flex-1 flex-col">
                    <span className={`block text-sm font-medium ${provider === "GEMINI" ? "text-indigo-900" : "text-slate-800"}`}>Cloud (Google Gemini)</span>
                    <span className="mt-1 text-xs text-slate-500">Requires an API key. Fast and intelligent.</span>
                  </span>
                  <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${provider === "GEMINI" ? "border-indigo-500" : "border-slate-300"}`}>
                    {provider === "GEMINI" && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />}
                  </span>
                </label>
              </div>
            </div>

            {provider !== "OLLAMA" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label htmlFor="api_key" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  {provider} API Key
                </label>
                <input
                  type="password"
                  id="api_key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl text-sm shadow-sm backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500">Your key is stored securely in the database.</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || (provider !== "OLLAMA" && apiKey.trim() === "")}
                className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:animate-breathe"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save AI Settings</>}
              </button>
            </div>
          </form>
        </section>

        {/* Section 4: Data & Privacy */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 border-b border-white/20 pb-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Data & Privacy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleExportData} className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/40 hover:bg-white/60 border border-white/50 rounded-xl text-slate-700 font-medium transition-colors backdrop-blur-sm">
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export My Data</span>
            </button>
            <button onClick={handleClearCache} className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-50/50 hover:bg-red-100/50 border border-red-200 rounded-xl text-red-600 font-medium transition-colors backdrop-blur-sm">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Clear Local Cache</span>
            </button>
          </div>
        </section>
      </GlassCard>
    </div>
  );
}
