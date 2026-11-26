
from time import perf_counter

from openai import OpenAI

from app.core.config import settings


def generate_response(prompt: str) -> dict:

    if settings.GROQ_API_KEY is None:
        raise RuntimeError("Groq API key is not configured")

    client = OpenAI(
        api_key=settings.GROQ_API_KEY.get_secret_value(),
        base_url="https://api.groq.com/openai/v1",
        timeout=60.0,
        max_retries=1
    )

    start_time = perf_counter()

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        latency_ms = round(
            (perf_counter() - start_time) * 1000,
            2
        )

        usage = response.usage

        input_tokens = usage.prompt_tokens if usage else 0
        output_tokens = usage.completion_tokens if usage else 0
        total_tokens = usage.total_tokens if usage else (
            input_tokens + output_tokens
        )

        ai_response = (
            response.choices[0].message.content or ""
        )

        return {
            "response": ai_response,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "latency_ms": latency_ms
        }

    finally:
        client.close()
