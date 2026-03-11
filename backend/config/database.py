import motor.motor_asyncio
from beanie import init_beanie
from models.user import User
from models.policy import Policy
from models.rule import Rule
from models.evaluation import Evaluation
from models.log import AuditLog
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "policy_engine")

client = None

async def connect_db():
    global client
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    await init_beanie(
        database=client[DB_NAME],
        document_models=[User, Policy, Rule, Evaluation, AuditLog]
    )
    print(f"✅ Connected to MongoDB: {DB_NAME}")

async def disconnect_db():
    global client
    if client:
        client.close()
        print("MongoDB disconnected")
