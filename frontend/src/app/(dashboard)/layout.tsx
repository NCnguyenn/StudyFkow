"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "../../store/useAppStore";
import GlobalSearchModal from "@/components/features/search/GlobalSearchModal";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { FloatingChat } from "@/components/features/chat/FloatingChat";
import InteractiveRoomEngine from "@/components/room/InteractiveRoomEngine";
import HudOverlay from "@/components/room/HudOverlay";
import ModuleTransition from "@/components/room/ModuleTransition";
import RadialNavMenu from "@/components/ui/RadialNavMenu";

// ═══════════════════════════════════════════════════════════════════════════════
// DashboardLayout v4.0 — Unified Room-as-UI Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 2-Layer system replaces the old 6-layer perspective approach:
//
//   Layer 0: InteractiveRoomEngine (composite room image + hotspots + zoom)
//   Layer 1: ModuleTransition (glassmorphism panel wrapping page children)
//
// Navigation:
//   - RadialNavMenu (FAB + radial menu) replaces CompactDock
//   - HudOverlay shows greeting/time/stats on dashboard
//
// The room composite is always visible. When a module is active, the room
// zooms toward the relevant object and dims, while the module panel slides in.
// Focus mode is special: the room stays visible and immersive (no panel).
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maps the current pathname to a module identifier.
 * Returns null for the dashboard (full room view).
 */
function getActiveModule(pathname: string): string | null {
  switch (pathname) {
    case '/':       return null; // Dashboard = full room, no module overlay
    case '/focus':  return '/focus';
    case '/notes':  return '/notes';
    case '/tasks':  return '/tasks';
    case '/insights': return '/insights';
    case '/settings': return '/settings';
    case '/canvas': return '/canvas';
    default:        return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mount the global SSE listener. Fires once after authentication is confirmed
  // (token exists in localStorage). Cleans up on logout / unmount.
  useRealtimeEvents();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("studyflow_access_token");
      if (token) {
        setIsAuthenticated(true);
        return;
      }

      // No token found, try to auto-login with dev account
      setIsLoggingIn(true);
      const devCredentials = {
        email: "developer@studyflow.com",
        password: "devpassword123",
      };

      try {
        // Attempt login
        let res = await fetch("http://localhost:8000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(devCredentials),
        });

        let result = await res.json();

        if (res.ok && result.success) {
          localStorage.setItem("studyflow_access_token", result.data.access_token);
          localStorage.setItem("sf_name", "Developer");
          setIsAuthenticated(true);
          return;
        }

        // Login failed (e.g., user doesn't exist), try to register first
        const registerPayload = {
          email: devCredentials.email,
          password: devCredentials.password,
          display_name: "Developer",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        const regRes = await fetch("http://localhost:8000/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerPayload),
        });

        const regResult = await regRes.json();

        if (regRes.ok && regResult.success) {
          // Registration succeeded, now login
          res = await fetch("http://localhost:8000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(devCredentials),
          });
          result = await res.json();
          if (res.ok && result.success) {
            localStorage.setItem("studyflow_access_token", result.data.access_token);
            localStorage.setItem("sf_name", "Developer");
            setIsAuthenticated(true);
            return;
          }
        }

        // If everything fails, fallback to mock token in dev mode
        console.warn("Backend authentication failed. Falling back to offline dev mode.");
        localStorage.setItem("studyflow_access_token", "dev_offline_token");
        localStorage.setItem("sf_name", "Developer (Offline)");
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auto-login failed (network error). Falling back to offline dev mode:", err);
        localStorage.setItem("studyflow_access_token", "dev_offline_token");
        localStorage.setItem("sf_name", "Developer (Offline)");
        setIsAuthenticated(true);
      } finally {
        setIsLoggingIn(false);
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        {isLoggingIn && (
          <p className="text-slate-400 text-sm animate-pulse">Đang tự động đăng nhập tài khoản phát triển...</p>
        )}
      </div>
    );
  }

  const activeModule = getActiveModule(pathname);

  return (
    <div className="flex h-screen overflow-hidden text-slate-100 relative">
      {/* ══════════════════════════════════════════════════════════════════
          Layer 0: Room Composite + Interactive Hotspots
          Renders the study room illustration and manages zoom transitions.
          Camera auto-adjusts based on the active module.
      ══════════════════════════════════════════════════════════════════ */}
      <InteractiveRoomEngine activeModule={activeModule} />

      {/* ══════════════════════════════════════════════════════════════════
          Layer 1: Module UI Panel
          Wraps page children in a glassmorphism panel with slide animation.
          Dashboard (/) and Focus (/focus) skip the panel (immersive).
      ══════════════════════════════════════════════════════════════════ */}
      <ModuleTransition module={activeModule ?? '/'}>
        <main className={`w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar ${activeModule === null ? 'pointer-events-none' : ''}`}>
          <div className={`h-full relative z-10 ${activeModule === null ? 'pointer-events-none' : ''}`}>
            {children}
          </div>
        </main>
      </ModuleTransition>

      {/* Global Cmd+K Search Palette */}
      <GlobalSearchModal />

      {/* ── HUD Overlay — greeting, time, stats (dashboard only) ──── */}
      <HudOverlay isFullRoom={activeModule === null} />

      {/* ── Radial Nav Menu — replaces CompactDock ──────────────────── */}
      <RadialNavMenu />

      {/* Global Floating Chat — Second Brain */}
      <FloatingChat />
    </div>
  );
}
