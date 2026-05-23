/**
 * API Utilities — Global Fetch Wrapper with Silent Refresh
 * 
 * Handles automatic JWT access token injection and silent refresh 
 * via HttpOnly cookies when encountering 401 Unauthorized errors.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Concurrency state to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Enhanced fetch wrapper that handles auth headers and automatic token refresh.
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("studyflow_access_token") : null;
  
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Build full URL if it's a relative path
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
  
  const res = await fetch(fullUrl, { 
    ...options, 
    headers 
  });

  // Handle 401 Unauthorized — Attempt Silent Refresh
  if (res.status === 401 && !fullUrl.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include", // Crucial: Sends the HttpOnly refresh_token cookie
        });

        if (refreshRes.ok) {
          const body = await refreshRes.json();
          const newToken = body.data.access_token;
          
          if (typeof window !== "undefined") {
            localStorage.setItem("studyflow_access_token", newToken);
          }
          
          onTokenRefreshed(newToken);
          isRefreshing = false;
          
          // Retry original request with the new token
          return fetch(fullUrl, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        isRefreshing = false;
        if (typeof window !== "undefined") {
          localStorage.removeItem("studyflow_access_token");
          window.location.href = "/login";
        }
        onTokenRefreshed(null); // release queued requests
        return res; // Return original 401
      }
    } else {
      // Concurrency safety: queue this request until the first refresh finishes
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          if (newToken) {
            resolve(
              fetch(fullUrl, {
                ...options,
                headers: {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                },
              })
            );
          } else {
            resolve(res); // if refresh failed, return original 401 response
          }
        });
      });
    }
  }

  return res;
}
