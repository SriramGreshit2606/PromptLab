
from time import perf_counter, sleep

from google import genai
from google.genai import errors

from app.core.config import settings


def generate_response(prompt: str) -> dict:
    if settings.GEMINI_API_KEY is None:
        raise RuntimeError("Gemini API key is not configured")

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY.get_secret_value()
    )

    start_time = perf_counter()

    try:
        # RETRY UP TO 3 TIMES FOR TEMPORARY SERVER ERRORS
        for attempt in range(3):
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

                return {
                    "response": response.text or "",
                    "input_tokens": getattr(
                        usage, "prompt_token_count", 0
                    ) or 0,
                    "output_tokens": getattr(
                        usage, "candidates_token_count", 0
                    ) or 0,
                    "total_tokens": getattr(
                        usage, "total_token_count", 0
                    ) or 0,
                    "latency_ms": latency_ms
                }

            except errors.ServerError:
                if attempt == 2:
                    raise

                # WAIT 2 SECONDS, THEN 4 SECONDS
                sleep(2 ** (attempt + 1))

    finally:
        client.close()
