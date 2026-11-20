"""Settings, read from environment variables (and the project's .env file).

The OpenAI key is NEVER hardcoded: put OPENAI_API_KEY in Java_tutor/.env (or the real environment).
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Local development: read Java_tutor/.env. On Vercel, env vars come from the project settings.
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / ".env.local")


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except ValueError:
        return default


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    openai_api_key: str | None
    openai_model: str
    max_output_tokens: int
    price_input_per_1m: float
    price_output_per_1m: float
    daily_limit_per_student: int
    admin_password: str | None
    database_url: str | None
    db_path: Path
    cors_origins: list[str]


def load_settings() -> Settings:
    key = os.getenv("OPENAI_API_KEY", "").strip() or None
    return Settings(
        openai_api_key=key,
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip(),
        max_output_tokens=_int("AI_MAX_OUTPUT_TOKENS", 900),
        # USD per 1M tokens, used only for the admin page's *estimated* cost. Defaults = gpt-4.1-mini list price.
        price_input_per_1m=_float("OPENAI_PRICE_INPUT_PER_1M", 0.40),
        price_output_per_1m=_float("OPENAI_PRICE_OUTPUT_PER_1M", 1.60),
        # Our own soft cap per student per day (0 = unlimited). Protects the monthly hard limit from one student.
        daily_limit_per_student=_int("AI_DAILY_LIMIT_PER_STUDENT", 60),
        admin_password=os.getenv("ADMIN_PASSWORD", "").strip() or None,
        # Vercel Postgres / Neon (Marketplace) sets DATABASE_URL (older integrations: POSTGRES_URL).
        database_url=(os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "").strip() or None,
        # Fallback when no Postgres is configured (local dev). On Vercel only /tmp is writable and is NOT persistent.
        db_path=Path(os.getenv("USAGE_DB_PATH") or ("/tmp/usage.db" if os.getenv("VERCEL") else str(PROJECT_ROOT / ".data" / "usage.db"))),
        cors_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()],
    )


settings = load_settings()
