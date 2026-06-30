from abc import ABC, abstractmethod
from typing import Any

class LLMProvider(ABC):
    @abstractmethod
    async def generate_insight(self, context_payload: dict[str, Any]) -> str:
        """
        Generates a personalized insight string from compressed user context.
        """
        pass

    @abstractmethod
    async def generate_chat_response(self, prompt: str) -> str:
        """
        Generates a direct response to a chat prompt.
        """
        pass
