
from time import perf_counter

from google import genai
from google.genai import types

from app.core.config import settings


def generate_response(prompt: str) -> dict:
    if settings.GEMINI_API_KEY is None:
        raise RuntimeError("Gemini API key is not configured")

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY.get_secret_value(),
        http_options=types.HttpOptions(
            timeout=60000,
            retry_options=types.HttpRetryOptions(
                attempts=2,
                initial_delay=1.0,
                max_delay=2.0
            )
        )
    )

    start_time = perf_counter()

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )

        latency_ms = round(
            (perf_counter() - start_time) * 1000,
            2
        )

        usage = response.usage_metadata

        input_tokens = (
            getattr(usage, "prompt_token_count", 0) or 0
        )

        output_tokens = (
            getattr(usage, "candidates_token_count", 0) or 0
        )

        # Preserve Gemini's total, including additional token categories.
        # Use a calculated fallback only if Gemini does not provide it.
        total_tokens = getattr(
            usage, "total_token_count", None
        )

        if total_tokens is None:
            thoughts_tokens = (
                getattr(usage, "thoughts_token_count", 0) or 0
            )

            tool_tokens = (
                getattr(usage, "tool_use_prompt_token_count", 0) or 0
            )

            total_tokens = (
                input_tokens
                + output_tokens
                + thoughts_tokens
                + tool_tokens
            )

        return {
            "response": response.text or "",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "latency_ms": latency_ms
        }

    finally:
        client.close()
