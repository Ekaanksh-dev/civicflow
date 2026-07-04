from db import complaints_collection

# Insert a test document
result = complaints_collection.insert_one({
    "complaint_id": "TEST-001",
    "citizen_name": "Test User",
    "status": "Submitted"
})
print("Inserted ID:", result.inserted_id)

# Read it back
doc = complaints_collection.find_one({"complaint_id": "TEST-001"})
print("Found:", doc)
