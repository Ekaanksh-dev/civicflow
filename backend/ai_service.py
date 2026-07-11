import os
import re
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

client = OpenAI(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    base_url=os.getenv("ANTHROPIC_BASE_URL"),
    max_retries=0,
    timeout=15.0
)

MODEL = os.getenv("ANTHROPIC_MODEL")


def classify_complaint(complaint_text: str) -> dict:
    prompt = f"""You are a civic complaint classifier. Given a citizen's complaint, 
return ONLY a JSON object (no other text) with these fields:
- category: one of ["Water", "Road", "Sanitation", "Electricity", "Other"]
- priority: one of ["High", "Medium", "Low"]
- department: the department name that should handle this (e.g. "Water Board", "Roads Department", "Sanitation Department", "Electricity Board")

Complaint: "{complaint_text}"

Respond with ONLY the JSON object, nothing else."""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )

        message = response.choices[0].message
        raw_text = message.content or getattr(message, "reasoning_content", "") or ""
        raw_text = raw_text.strip().replace("```json", "").replace("```", "").strip()

        match = re.search(r"\{[^{}]*\}", raw_text, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            result = {"category": "Other", "priority": "Medium", "department": "General"}

    except Exception as e:
        print(f"[AI Classify] Failed or timed out: {e}")
        result = {"category": "Other", "priority": "Medium", "department": "General"}

    return result
