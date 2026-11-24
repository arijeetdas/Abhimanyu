"""Typed settings loaded from environment variables and backend/.env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", env_ignore_empty=True, extra="ignore"
    )

    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    # Comma-separated list. "*" is fine for local development only.
    cors_origins: str = "*"

    database_url: str = ""
    neo4j_uri: str = ""
    neo4j_username: str = ""
    neo4j_password: str = ""
    chroma_host: str = ""
    chroma_port: int | None = None
    redis_url: str = ""

    gemini_api_key: str = ""
    groq_api_key: str = ""
    anthropic_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
