from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_NAME: str = "PromptLab"
    APP_ENV: str = "development"

    DATABASE_URL: str
    SECRET_KEY: str

    # Existing Gemini settings
    GEMINI_API_KEY: SecretStr | None = None
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # New Groq settings
    GROQ_API_KEY: SecretStr | None = None
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

