import os
import re
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    base_url=os.getenv("ANTHROPIC_BASE_URL")
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

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )

    message = response.choices[0].message
    # MiniMax reasoning models may put the answer in reasoning_content if content is empty
    raw_text = message.content or message.reasoning_content or ""

    # Extract the JSON object even if it's surrounded by reasoning text
    match = re.search(r"\{[^{}]*\}", raw_text, re.DOTALL)

    if match:
        try:
            result = json.loads(match.group())
        except json.JSONDecodeError:
            result = {"category": "Other", "priority": "Medium", "department": "General"}
    else:
        result = {"category": "Other", "priority": "Medium", "department": "General"}

    return result
