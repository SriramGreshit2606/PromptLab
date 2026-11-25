
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "PromptLab"
    APP_ENV: str = "development"

    DATABASE_URL: str
    SECRET_KEY: str

    GEMINI_API_KEY: SecretStr | None = None
    GEMINI_MODEL: str = "gemini-3.8-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

