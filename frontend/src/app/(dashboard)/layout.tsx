"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  CheckSquare,
  Timer,
  BookOpen,
  LineChart,
  Settings,
  LogOut,
  Sparkles,
  Menu
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import GlobalSearchModal from "@/components/features/search/GlobalSearchModal";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { FloatingChat } from "@/components/features/chat/FloatingChat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isZenMode, setZenMode } = useAppStore();

  // Mount the global SSE listener. Fires once after authentication is confirmed
  // (token exists in localStorage). Cleans up on logout / unmount.
  useRealtimeEvents();

  useEffect(() => {
    const token = localStorage.getItem("studyflow_access_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("studyflow_access_token");
    router.push("/login");
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Planner", href: "/tasks", icon: CheckSquare },
    { name: "Focus", href: "/focus", icon: Timer },
    { name: "Notes", href: "/notes", icon: BookOpen },
    { name: "Insights", href: "/insights", icon: LineChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden text-slate-800 relative">
      {/* Sidebar */}
      <aside className={`fixed lg:relative z-20 h-full w-64 glass-sidebar flex flex-col transition-all duration-500 ease-in-out ${isZenMode ? '-translate-x-full lg:-ml-64 opacity-0' : 'translate-x-0 opacity-100'}`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 tracking-wide">
            StudyFlow
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-indigo-500/15 text-indigo-600 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-800 border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-indigo-500" : "group-hover:text-slate-600"}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-500" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden transition-all duration-500 ease-in-out custom-scrollbar">
        {/* Toggle Zen Mode Button */}
        {isZenMode && (
          <button 
            onClick={() => setZenMode(false)}
            className="absolute top-6 left-6 z-30 p-2 rounded-xl glass-card text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="h-full relative z-10">
          {children}
        </div>

        {/* Global Cmd+K Search Palette */}
        <GlobalSearchModal />
      </main>

      {/* Global Floating Chat — Second Brain */}
      <FloatingChat />
    </div>
  );
}
