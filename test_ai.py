from ai_service import classify_complaint

test_complaints = [
    "There is garbage piled up on my street for 3 days, terrible smell",
    "Water pipe burst and flooding the road since morning",
    "Big pothole on main road causing accidents",
    "Streetlight not working on our lane for a week"
]

for text in test_complaints:
    result = classify_complaint(text)
    print(f"Complaint: {text}")
    print(f"Result: {result}\n")
