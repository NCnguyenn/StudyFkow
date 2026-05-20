import { fetchWithAuth } from "@/lib/api-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface Insight {
  id: string;
  insight_type: string;
  content: string;
  feedback_score: number;
}

export interface InsightFeedbackPayload {
  score: number;
  dismiss: boolean;
}

export async function fetchInsights(): Promise<Insight[]> {
  const response = await fetchWithAuth("/insights", {
    method: "GET",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }
  return response.json();
}

export async function submitInsightFeedback(
  insightId: string,
  payload: InsightFeedbackPayload
): Promise<void> {
  const response = await fetchWithAuth(`/insights/${insightId}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to submit insight feedback");
  }
}

export async function generateLlmInsight(): Promise<void> {
  const response = await fetchWithAuth("/insights/generate-llm", {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to trigger AI insight generation");
  }
}
