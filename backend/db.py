import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

client = MongoClient(os.getenv("MONGO_URI"))
db = client["civicflow"]
complaints_collection = db["complaints"]
