import os
from datetime import datetime, timedelta
from fastapi import FastAPI
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
from pymongo import MongoClient
from ai_service import classify_complaint
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel, field_validator
import difflib
import asyncio
from contextlib import asynccontextmanager
from typing import Optional
from agent_service import agent_decide_action
from fastapi.middleware.cors import CORSMiddleware
from email_service import send_complaint_email

load_dotenv()

app = FastAPI()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["civicflow"]
complaints_collection = db["complaints"]

SLA_HOURS = {"High": 24, "Medium": 72, "Low": 168}  # 24hr, 3 days, 7 days
DUPLICATE_WINDOW_DAYS = 7
TEXT_SIMILARITY_THRESHOLD = 0.6

def run_escalation_check():
    now = datetime.utcnow()
    active_statuses = ["Submitted", "Categorized", "Assigned", "In Progress", "Waiting for citizen response"]

    overdue_complaints = complaints_collection.find({
        "status": {"$in": active_statuses},
        "sla_deadline": {"$lt": now}
    })

    count = 0
    for doc in overdue_complaints:
        log_entry = {
            "old_status": doc["status"],
            "new_status": "Escalated",
            "updated_by": "system",
            "timestamp": now,
            "remarks": "Auto-escalated: SLA deadline missed"
        }
        complaints_collection.update_one(
            {"complaint_id": doc["complaint_id"]},
            {
                "$set": {"status": "Escalated", "updated_at": now},
                "$push": {"status_logs": log_entry}
            }
        )
        count += 1

    if count > 0:
        print(f"[Escalation Engine] Escalated {count} complaint(s) at {now}")


async def escalation_loop():
    while True:
        run_escalation_check()
        await asyncio.sleep(60)  # check every 60 seconds


class ComplaintRequest(BaseModel):
    citizen_name: str
    contact_info: str
    email: str = None
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

class StatusUpdateRequest(BaseModel):
    new_status: str
    updated_by: str = "admin"
    remarks: str = None

def generate_complaint_id():
    today = datetime.utcnow().strftime("%Y%m%d")
    count_today = complaints_collection.count_documents({
        "complaint_id": {"$regex": f"^CF-{today}"}
    })
    return f"CF-{today}-{count_today + 1:03d}"

def run_agent_review():
    now = datetime.utcnow()
    active_statuses = ["Submitted", "Categorized", "Assigned", "In Progress", "Waiting for citizen response"]

    at_risk = complaints_collection.find({"status": {"$in": active_statuses}})

    reviewed = 0
    for doc in at_risk:
        decision = agent_decide_action(doc)

        complaints_collection.update_one(
            {"complaint_id": doc["complaint_id"]},
            {"$push": {"agent_logs": decision}}
        )
        reviewed += 1

    if reviewed > 0:
        print(f"[AI Agent] Reviewed {reviewed} complaint(s) at {now}")


async def agent_loop():
    while True:
        run_agent_review()
        await asyncio.sleep(86400)  # every 2 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    escalation_task = asyncio.create_task(escalation_loop())
    agent_task = asyncio.create_task(agent_loop())
    yield
    escalation_task.cancel()
    agent_task.cancel()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for hackathon; restrict in real production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_STATUSES = [
    "Submitted", "Categorized", "Assigned", "In Progress",
    "Waiting for Citizen Response", "Resolved", "Closed", "Escalated"
]

@app.post("/complaints")
def submit_complaint(complaint: ComplaintRequest):
    classification = classify_complaint(complaint.complaint_text)
    priority = classification.get("priority", "Medium")
    category = classification.get("category", "Other")
    sla_hours = SLA_HOURS.get(priority, 72)

    duplicate_id = find_duplicate(
        complaint.complaint_text, complaint.contact_info, complaint.location, category
    )

    complaint_id = generate_complaint_id()
    now = datetime.utcnow()

    status_logs = [
        {
            "old_status": None,
            "new_status": "Submitted",
            "updated_by": "system",
            "timestamp": now,
            "remarks": "Complaint submitted and auto-classified"
        }
    ]

    final_status = "Submitted"

    if duplicate_id:
        final_status = "Closed"
        status_logs.append({
            "old_status": "Submitted",
            "new_status": "Closed",
            "updated_by": "system",
            "timestamp": now,
            "remarks": f"Auto-closed: duplicate of {duplicate_id}"
        })

    doc = {
        "complaint_id": complaint_id,
        "citizen_name": complaint.citizen_name,
        "contact_info": complaint.contact_info,
        "email": complaint.email,
        "complaint_text": complaint.complaint_text,
        "category": category,
        "priority": priority,
        "department": classification.get("department", "General"),
        "status": final_status,
        "location": complaint.location,
        "created_at": now,
        "updated_at": now,
        "sla_deadline": now + timedelta(hours=sla_hours),
        "duplicate_of": duplicate_id,
        "status_logs": status_logs
    }

    complaints_collection.insert_one(doc)
    email_sent = False
    if complaint.email:
        email_sent = send_complaint_email(
            complaint.email, complaint_id, category, priority, doc["department"]
        )

    return {
        "complaint_id": complaint_id,
        "category": category,
        "priority": priority,
        "department": doc["department"],
        "status": final_status,
        "duplicate_of": duplicate_id,
        "email_sent": email_sent
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

@app.patch("/complaints/{complaint_id}")
@app.patch("/complaints/{complaint_id}")
def update_complaint_status(complaint_id: str, update: StatusUpdateRequest):
    doc = complaints_collection.find_one({"complaint_id": complaint_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = doc["status"]
    now = datetime.utcnow()

    new_log_entry = {
        "old_status": old_status,
        "new_status": update.new_status,
        "updated_by": update.updated_by,
        "timestamp": now,
        "remarks": update.remarks
    }

    set_fields = {
        "status": update.new_status,
        "updated_at": now
    }

    # If moving OUT of Escalated back into an active working status,
    # reset the SLA deadline so it doesn't immediately re-escalate
    active_statuses = ["Assigned", "In Progress", "Waiting for citizen response"]
    if old_status == "Escalated" and update.new_status in active_statuses:
        priority = doc.get("priority", "Medium")
        sla_hours = SLA_HOURS.get(priority, 72)
        new_deadline = now + timedelta(hours=sla_hours)
        set_fields["sla_deadline"] = new_deadline
        new_log_entry["remarks"] = (new_log_entry["remarks"] or "") + " (SLA deadline reset)"

    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": set_fields,
            "$push": {"status_logs": new_log_entry}
        }
    )

    return {
        "complaint_id": complaint_id,
        "old_status": old_status,
        "new_status": update.new_status,
        "updated_at": now,
        "sla_reset": "sla_deadline" in set_fields
    }

def check_and_escalate_complaints():
    now = datetime.utcnow()
    active_statuses = ["Submitted", "Categorized", "Assigned", "In Progress", "Waiting for Citizen Response"]

    overdue = complaints_collection.find({
        "status": {"$in": active_statuses},
        "sla_deadline": {"$lt": now}
    })

    for doc in overdue:
        log_entry = {
            "old_status": doc["status"],
            "new_status": "Escalated",
            "updated_by": "system",
            "timestamp": now,
            "remarks": "SLA deadline missed — auto-escalated"
        }

        complaints_collection.update_one(
            {"complaint_id": doc["complaint_id"]},
            {
                "$set": {"status": "Escalated", "updated_at": now},
                "$push": {"status_logs": log_entry}
            }
        )
        print(f"Escalated: {doc['complaint_id']}")

scheduler = BackgroundScheduler()
scheduler.add_job(check_and_escalate_complaints, "interval", minutes=1)
scheduler.start()

class StatusUpdateRequest(BaseModel):
    new_status: str
    remarks: str = None
    updated_by: str = "admin"

    @field_validator("new_status")
    @classmethod
    def validate_status(cls, v):
        valid_statuses = [
            "Submitted", "Categorized", "Assigned", "In Progress",
            "Waiting for citizen response", "Resolved", "Closed", "Escalated"
        ]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {valid_statuses}")
        return v


@app.patch("/complaints/{complaint_id}")
def update_complaint_status(complaint_id: str, update: StatusUpdateRequest):
    doc = complaints_collection.find_one({"complaint_id": complaint_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = doc["status"]
    now = datetime.utcnow()

    new_log_entry = {
        "old_status": old_status,
        "new_status": update.new_status,
        "updated_by": update.updated_by,
        "timestamp": now,
        "remarks": update.remarks
    }

    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "status": update.new_status,
                "updated_at": now
            },
            "$push": {
                "status_logs": new_log_entry
            }
        }
    )

    return {
        "complaint_id": complaint_id,
        "old_status": old_status,
        "new_status": update.new_status,
        "updated_at": now
    }
def find_duplicate(complaint_text, contact_info, location, category):
    window_start = datetime.utcnow() - timedelta(days=DUPLICATE_WINDOW_DAYS)

    candidates = complaints_collection.find({
        "category": category,
        "created_at": {"$gte": window_start}
    })

    for doc in candidates:
        same_phone = doc.get("contact_info") == contact_info
        same_location = (
            location and doc.get("location")
            and doc["location"].strip().lower() == location.strip().lower()
        )
        similarity = difflib.SequenceMatcher(
            None, complaint_text.lower(), doc.get("complaint_text", "").lower()
        ).ratio()

        if same_phone or same_location or similarity >= TEXT_SIMILARITY_THRESHOLD:
            return doc["complaint_id"]

    return None
@app.get("/admin/complaints")
def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50
):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if department:
        query["department"] = department
    if priority:
        query["priority"] = priority

    cursor = complaints_collection.find(query).sort("created_at", -1).limit(limit)

    results = []
    for doc in cursor:
        results.append({
            "complaint_id": doc.get("complaint_id"),
            "citizen_name": doc.get("citizen_name"),
            "category": doc.get("category"),
            "priority": doc.get("priority"),
            "department": doc.get("department"),
            "status": doc.get("status"),
            "location": doc.get("location"),
            "created_at": doc.get("created_at"),
            "sla_deadline": doc.get("sla_deadline"),
            "duplicate_of": doc.get("duplicate_of")
        })

    return {"count": len(results), "complaints": results}

@app.get("/complaints/{complaint_id}/agent-log")
def get_agent_log(complaint_id: str):
    doc = complaints_collection.find_one({"complaint_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {
        "complaint_id": complaint_id,
        "agent_logs": doc.get("agent_logs", [])
    }

@app.post("/agent/run-now")
def trigger_agent_review():
    run_agent_review()
    return {"message": "Agent review triggered"}

@app.get("/health")
def health_check():
    try:
        client.admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
        "timestamp": datetime.utcnow()
    }

@app.get("/search")
def search_complaints(
    q: Optional[str] = None,
    complaint_id: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 50
):
    query = {}

    if complaint_id:
        query["complaint_id"] = complaint_id
    if status:
        query["status"] = status
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if q:
        query["complaint_text"] = {"$regex": q, "$options": "i"}

    cursor = complaints_collection.find(query).sort("created_at", -1).limit(limit)

    results = []
    for doc in cursor:
        results.append({
            "complaint_id": doc.get("complaint_id"),
            "citizen_name": doc.get("citizen_name"),
            "complaint_text": doc.get("complaint_text"),
            "category": doc.get("category"),
            "status": doc.get("status"),
            "location": doc.get("location"),
            "created_at": doc.get("created_at")
        })

    return {"count": len(results), "results": results}

@app.get("/analytics")
def get_analytics():
    now = datetime.utcnow()

    by_category = list(complaints_collection.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]))

    by_status = list(complaints_collection.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]))

    by_department = list(complaints_collection.aggregate([
        {"$group": {"_id": "$department", "count": {"$sum": 1}}}
    ]))

    total_complaints = complaints_collection.count_documents({})

    sla_breached = complaints_collection.count_documents({
        "sla_deadline": {"$lt": now},
        "status": {"$nin": ["Resolved", "Closed"]}
    })

    def format_group(group):
        return {item["_id"] or "Unknown": item["count"] for item in group}

    return {
        "total_complaints": total_complaints,
        "sla_breached_active": sla_breached,
        "by_category": format_group(by_category),
        "by_status": format_group(by_status),
        "by_department": format_group(by_department)
    }
