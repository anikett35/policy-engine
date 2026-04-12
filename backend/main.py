from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import policies, rules, evaluations, auth, logs
from routes import ml_suggestions, ai_generator
from config.database import connect_db, disconnect_db

app = FastAPI(title="Policy Rules Evaluation Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://policy-engine-v4ce.onrender.com", "https://policy-engine-steel.vercel.app", "https://policy-engine-rubiscape.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

app.include_router(auth.router,           prefix="/api/auth",        tags=["auth"])
app.include_router(policies.router,       prefix="/api/policies",    tags=["policies"])
app.include_router(rules.router,          prefix="/api/rules",       tags=["rules"])
app.include_router(evaluations.router,    prefix="/api/evaluations", tags=["evaluations"])
app.include_router(logs.router,           prefix="/api/logs",        tags=["logs"])
app.include_router(ml_suggestions.router, prefix="/api/ml",          tags=["ml"])
app.include_router(ai_generator.router,   prefix="/api/ai",          tags=["ai"])

@app.get("/")
async def root():
    return {"message": "PolicyEngine API v2.0 — ML + AI Generator", "version": "2.0.0"}
