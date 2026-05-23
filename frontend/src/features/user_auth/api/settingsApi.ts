import { fetchWithAuth } from "@/lib/api-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export interface LLMSettings {
  provider: "OLLAMA" | "GEMINI" | "OPENAI";
  api_key: string | null;
}

export async function fetchLlmSettings(): Promise<LLMSettings> {
  const response = await fetchWithAuth("/auth/settings/llm", {
    method: "GET",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch LLM settings");
  }
  
  const data = await response.json();
  return data.data;
}

export async function updateLlmSettings(settings: LLMSettings): Promise<void> {
  const response = await fetchWithAuth("/auth/settings/llm", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? "Failed to update LLM settings");
  }
}
