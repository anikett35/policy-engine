# PolicyEngine — Rule Evaluation System

**Project:** RS-BE-03 | Policy Rules Evaluation Engine  
**Stack:** Python FastAPI + React + MongoDB

---

## Project Structure

```
policy-engine/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/     # Dashboard, Policies, Rules, Evaluate, Evaluations, Logs, Login
│   │   ├── components/# Layout, Sidebar
│   │   ├── api/       # Axios instance + API endpoints
│   │   ├── store/     # Zustand auth store
│   │   └── App.jsx
│   └── package.json
│
└── backend/           # Python FastAPI
    ├── main.py
    ├── routes/        # auth, policies, rules, evaluations, logs
    ├── models/        # User, Policy, Rule, Evaluation, AuditLog (MongoDB/Beanie)
    ├── services/      # rule_engine.py — core evaluation logic
    ├── config/        # database.py
    └── requirements.txt
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Zustand |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| ORM | Beanie (async MongoDB ODM) |
| Database | MongoDB |
| Auth | JWT (python-jose) + bcrypt |

---

## Setup & Run

### 1. Start MongoDB
```bash
mongod --dbpath /data/db
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API Docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Features

- **Authentication** — Register/Login with JWT, roles: admin/analyst
- **Policy Management** — Create, update, delete policies with status/versioning
- **Rule Builder** — Visual rule builder with conditions, operators, logic (AND/OR), actions
- **Rule Engine** — Python-based evaluation engine supporting 10+ operators
- **Evaluate** — Run input JSON data against any policy, see per-rule results
- **Dashboard** — Stats, pie charts, recent evaluations
- **Audit Logs** — Every action is logged with actor, timestamp, details

## Supported Operators
`equals`, `not_equals`, `greater_than`, `less_than`, `contains`, `not_contains`, `in`, `not_in`, `is_null`, `is_not_null`

## Decision Types
- **allow** — Input passes the policy
- **deny** — Input is rejected (deny takes highest priority)  
- **flag** — Input is flagged for review
# policy-engine
