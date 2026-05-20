"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload = isLogin
        ? { email, password }
        : {
            email,
            password,
            display_name: displayName,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.detail || result.message || "Authentication failed");
      }

      if (isLogin) {
        localStorage.setItem("studyflow_access_token", result.data.access_token);
        router.push("/");
      } else {
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Floating orbs for ambient warmth */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-md w-full">
        
        {/* Glowing Orb Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 w-20 h-20 bg-indigo-500/30 rounded-2xl blur-xl" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
            AI StudyFlow
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? "Welcome back! Ready to focus?" : "Create an account to start your journey."}
          </p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${error.includes('successful') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/15 text-red-300 border border-red-500/20'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 glass-input"
                    placeholder="How should we call you?"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 glass-input"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 glass-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
