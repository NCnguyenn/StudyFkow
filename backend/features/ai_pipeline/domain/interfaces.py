from abc import ABC, abstractmethod
from typing import Any

class LLMProvider(ABC):
    @abstractmethod
    async def generate_insight(self, context_payload: dict[str, Any]) -> str:
        """
        Generates a personalized insight string from compressed user context.
        """
        pass
