
import json
from openai import OpenAI
from app.core.config import settings


def evaluate_response(
    question: str,
    expected_answer: str,
    actual_answer: str
) -> dict:

    if settings.GROQ_API_KEY is None:
        raise RuntimeError("Groq API key is not configured")

    client = OpenAI(
        api_key=settings.GROQ_API_KEY.get_secret_value(),
        base_url="https://api.groq.com/openai/v1",
        timeout=60.0,
        max_retries=1
    )

    evaluation_prompt = f"""
You are an expert AI response evaluator.

Evaluate the actual answer against the expected answer.
Judge meaning and factual correctness, not exact word matching.

Question:
{question}

Expected answer:
{expected_answer}

Actual answer:
{actual_answer}

Give each criterion a score from 0 to 100:

1. correctness: factual accuracy
2. relevance: answers the question
3. completeness: covers the important information
4. clarity: easy to understand
5. instruction_following: follows the question and instructions

Weights:
- correctness: 35%
- relevance: 25%
- completeness: 20%
- clarity: 10%
- instruction_following: 10%

Return ONLY valid JSON in this exact format:
{{
    "correctness": 0,
    "relevance": 0,
    "completeness": 0,
    "clarity": 0,
    "instruction_following": 0,
    "reason": "Short explanation"
}}

Do not reward irrelevant extra information.
Penalize factual errors and unsupported claims.
"""

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": evaluation_prompt
                }
            ],
            temperature=0
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("AI Judge returned an empty response")

        result = json.loads(content)

        criteria = [
            "correctness",
            "relevance",
            "completeness",
            "clarity",
            "instruction_following"
        ]

        for criterion in criteria:
            value = result[criterion]

            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"Invalid score: {criterion}")

            if not 0 <= value <= 100:
                raise ValueError(f"Score out of range: {criterion}")

        final_score = (
            result["correctness"] * 0.35
            + result["relevance"] * 0.25
            + result["completeness"] * 0.20
            + result["clarity"] * 0.10
            + result["instruction_following"] * 0.10
        )

        return {
            "score": round(final_score, 2),
            "criteria": {
                key: result[key] for key in criteria
            },
            "reason": str(result.get("reason", ""))
        }

    finally:
        client.close()
