import os
from datetime import datetime, timedelta
from fastapi import FastAPI
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
from pymongo import MongoClient
from ai_service import classify_complaint
from fastapi import FastAPI, HTTPException


load_dotenv()

app = FastAPI()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["civicflow"]
complaints_collection = db["complaints"]

SLA_HOURS = {"High": 24, "Medium": 72, "Low": 168}  # 24hr, 3 days, 7 days


class ComplaintRequest(BaseModel):
    citizen_name: str
    contact_info: str
    complaint_text: str
    location: str = None

    @field_validator("contact_info")
    @classmethod
    def validate_phone(cls, v):
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Phone number must contain only digits (and optional +)")
        if len(cleaned) < 10:
            raise ValueError("Phone number seems too short")
        return cleaned


def generate_complaint_id():
    today = datetime.utcnow().strftime("%Y%m%d")
    count_today = complaints_collection.count_documents({
        "complaint_id": {"$regex": f"^CF-{today}"}
    })
    return f"CF-{today}-{count_today + 1:03d}"


@app.post("/complaints")
def submit_complaint(complaint: ComplaintRequest):
    classification = classify_complaint(complaint.complaint_text)
    priority = classification.get("priority", "Medium")
    sla_hours = SLA_HOURS.get(priority, 72)

    complaint_id = generate_complaint_id()
    now = datetime.utcnow()

    doc = {
        "complaint_id": complaint_id,
        "citizen_name": complaint.citizen_name,
        "contact_info": complaint.contact_info,
        "complaint_text": complaint.complaint_text,
        "category": classification.get("category", "Other"),
        "priority": priority,
        "department": classification.get("department", "General"),
        "status": "Submitted",
        "location": complaint.location,
        "created_at": now,
        "updated_at": now,
        "sla_deadline": now + timedelta(hours=sla_hours),
        "status_logs": [
            {
                "old_status": None,
                "new_status": "Submitted",
                "updated_by": "system",
                "timestamp": now,
                "remarks": "Complaint submitted and auto-classified"
            }
        ]
    }
@app.get("/complaints/{complaint_id}")
def track_complaint(complaint_id: str):
    doc = complaints_collection.find_one({"complaint_id": complaint_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return {
        "complaint_id": doc["complaint_id"],
        "citizen_name": doc["citizen_name"],
        "category": doc["category"],
        "priority": doc["priority"],
        "department": doc["department"],
        "status": doc["status"],
        "location": doc.get("location"),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "sla_deadline": doc["sla_deadline"],
        "timeline": doc.get("status_logs", [])
    }
    complaints_collection.insert_one(doc)

    return {
        "complaint_id": complaint_id,
        "category": doc["category"],
        "priority": doc["priority"],
        "department": doc["department"],
        "status": doc["status"]
    }
