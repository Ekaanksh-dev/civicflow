import os
import json
import re
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

client = OpenAI(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    base_url=os.getenv("ANTHROPIC_BASE_URL")
)

MODEL = os.getenv("ANTHROPIC_MODEL")


def agent_decide_action(complaint: dict) -> dict:
    now = datetime.utcnow()
    sla_deadline = complaint.get("sla_deadline")
    hours_overdue = None
    if sla_deadline:
        hours_overdue = round((now - sla_deadline).total_seconds() / 3600, 1)

    prompt = f"""You are an autonomous civic complaint monitoring agent. You review complaints
that are at risk of missing their SLA deadline and decide what action should be taken.
You do NOT take the action yourself — you only recommend it with reasoning, for a human
supervisor to review.

Complaint details:
- Text: "{complaint.get('complaint_text')}"
- Category: {complaint.get('category')}
- Current priority: {complaint.get('priority')}
- Current status: {complaint.get('status')}
- Department: {complaint.get('department')}
- Hours overdue (negative means not yet due): {hours_overdue}

Choose exactly ONE recommended_action from this list:
- "escalate_to_senior" (situation is serious and overdue, needs senior department attention)
- "increase_priority" (should be bumped to a higher priority given the content/context)
- "notify_citizen" (citizen should get a status update, but no other change needed)
- "no_action_needed" (still reasonably on track, don't do anything yet)

Respond with ONLY a JSON object with these fields:
- recommended_action: one of the four options above
- reasoning: a short 1-2 sentence explanation of why
- confidence: one of ["High", "Medium", "Low"]
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )
   
    message = response.choices[0].message
    raw_text = message.content or getattr(message, "reasoning_content", "") or ""

    raw_text = raw_text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
        except json.JSONDecodeError:
            result = {"recommended_action": "no_action_needed", "reasoning": "Could not parse agent response", "confidence": "Low"}
    else:
        result = {"recommended_action": "no_action_needed", "reasoning": "No response from agent", "confidence": "Low"}

    result["hours_overdue"] = hours_overdue
    result["evaluated_at"] = now
    return result
