# Policy Engine Task TODO
Status: Completed ✅

## Completed Steps:
1. [x] Fixed `backend/main.py` - Added CORS for localhost, Render backend, Vercel frontend
2. [x] Backend server running on http://localhost:8000 (reloaded after fix)
3. [x] Frontend axios updated: local uses `/api`, production uses Render backend
4. [x] Frontend deployed: https://policy-engine-steel.vercel.app
5. [x] Full integration: Vercel frontend → Render backend (CORS enabled)

## Run Locally:
**Backend:** Already running `uvicorn main:app --reload --port 8000`  
**Frontend:** `cd frontend && npm run dev` (localhost:5173 → localhost:8000/api)

## Live Demo:
- Backend: https://policy-engine-v4ce.onrender.com  
- Frontend: https://policy-engine-steel.vercel.app/login  
Test login/register - calls Render backend.

Task complete: Deployed backend (Render) + frontend (Vercel) fully integrated.
