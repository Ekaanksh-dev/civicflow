import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")


def send_complaint_email(to_email: str, complaint_id: str, category: str, priority: str, department: str) -> bool:
    subject = f"CivicFlow: Complaint Registered - {complaint_id}"
    body = f"""Your complaint has been successfully registered.

Complaint ID: {complaint_id}
Category: {category}
Priority: {priority}
Assigned Department: {department}

You can track your complaint status anytime using this Complaint ID.

- CivicFlow Team"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"[Email] Failed to send: {e}")
        return False
