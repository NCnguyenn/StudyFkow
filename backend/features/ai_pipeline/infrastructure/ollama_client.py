import httpx
from typing import Any
import json
from ..domain.interfaces import LLMProvider

class OllamaProvider(LLMProvider):
    def __init__(self, model: str = "llama3"):
        self.base_url = "http://localhost:11434/api/generate"
        self.model = model

    async def generate_insight(self, context_payload: dict[str, Any]) -> str:
        prompt = self._build_prompt(context_payload)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.base_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "Could not generate insight.").strip()
            except Exception as e:
                return f"Error communicating with local Ollama instance: {e}"

    def _build_prompt(self, payload: dict[str, Any]) -> str:
        negative_constraints = payload.get("negative_constraints", [])
        constraint_str = ""
        if negative_constraints:
            constraint_str = "\nUser constraints: Do NOT generate any advice similar to these previously rejected insights: " + json.dumps(negative_constraints)
            
        return f"""You are an AI Study Coach. Analyze this user's study context and provide one highly actionable, personalized insight.
Keep it under 2 sentences.{constraint_str}
Context: {json.dumps({k: v for k, v in payload.items() if k != "negative_constraints"})}
Insight:"""
