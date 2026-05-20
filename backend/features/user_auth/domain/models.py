from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
import zoneinfo

class UserRegistrationRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str = Field(..., min_length=1, max_length=100)
    timezone: str
    
    @field_validator('timezone')
    def validate_timezone(cls, v):
        try:
            zoneinfo.ZoneInfo(v)
            return v
        except zoneinfo.ZoneInfoNotFoundError:
            raise ValueError("Invalid IANA timezone")

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponseData(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"

class UserSummary(BaseModel):
    user_id: UUID
    email: EmailStr
    display_name: str
    subscription_tier: str
    soul_color_hex: str
    lite_mode_enabled: bool

class UserPreferencesUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    soul_color_hex: Optional[str] = Field(None, pattern=r'^#[0-9a-fA-F]{6}$')
    lite_mode_enabled: Optional[bool] = None

class LLMSettingsUpdate(BaseModel):
    provider: str = Field(..., pattern="^(OLLAMA|GEMINI|OPENAI)$")
    api_key: Optional[str] = None
