from ..domain.interfaces import LLMProvider
from ..infrastructure.ollama_client import OllamaProvider
from ..infrastructure.gemini_client import GeminiProvider

def get_llm_provider(provider_name: str, api_key: str | None) -> LLMProvider:
    provider_name = provider_name.upper() if provider_name else "OLLAMA"
    
    if provider_name == "GEMINI":
        return GeminiProvider(api_key=api_key or "")
        
    # Default to local Ollama
    return OllamaProvider()
