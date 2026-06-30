import httpx
from typing import Any
import json
from ..domain.interfaces import LLMProvider

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    async def generate_insight(self, context_payload: dict[str, Any]) -> str:
        if not self.api_key:
            return "Error: Gemini API key is missing."

        prompt = self._build_prompt(context_payload)
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.url, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                return f"Error communicating with Gemini API: {e}"

    def _build_prompt(self, payload: dict[str, Any]) -> str:
        negative_constraints = payload.get("negative_constraints", [])
        constraint_str = ""
        if negative_constraints:
            constraint_str = "\nUser constraints: Do NOT generate any advice similar to these previously rejected insights: " + json.dumps(negative_constraints)
            
        return f"""You are an AI Study Coach. Analyze this user's study context and provide one highly actionable, personalized insight.
Keep it under 2 sentences.{constraint_str}
Context: {json.dumps({k: v for k, v in payload.items() if k != "negative_constraints"})}
Insight:"""

    async def generate_chat_response(self, prompt: str) -> str:
        if not self.api_key:
            return "Error: Gemini API key is missing."

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.url, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                return f"Error communicating with Gemini API: {e}"
