# ═══════════════════════════════════════════════════════════════
#   WEALTHIFY — Backend API Service
# ═══════════════════════════════════════════════════════════════

Wealthify Backend is a high-performance, robust, and production-ready REST API built using **FastAPI** and **SQLAlchemy**. It acts as the business logic, database mapper, and analytical engine for the Wealthify Mutual Fund Transaction Dashboard. It manages full CRUD operations for Investors, Mutual Funds, and Transactions, and calculates aggregated dashboards and deep-dive tree-tables on the fly.

---

## 🛠️ Tech Stack & Key Technologies

* **FastAPI**: Modern, high-performance web framework for building APIs with Python.
* **SQLAlchemy**: Object-Relational Mapper (ORM) for SQL databases, managing relationships and queries cleanly.
* **PostgreSQL**: Robust, enterprise-grade relational database for persistent data storage.
* **Uvicorn**: Lightning-fast ASGI web server implementation.
* **Pydantic & Pydantic Settings**: Data validation, type enforcement, and settings management using environment variables.
* **Psycopg2 Binary**: PostgreSQL database adapter for Python.

---

## 📁 Backend Directory Structure

```text
backend/
├── app/
│   ├── core/           # Configuration, security, and database session lifecycle
│   ├── models/         # SQLAlchemy Database models (Investor, Fund, Transaction)
│   ├── schemas/        # Pydantic schemas for data validation and API payloads
│   ├── routes/         # FastAPI router modules for separate API resources
│   ├── services/       # Core business logic and aggregate calculation calculations
│   └── main.py         # App initialisation and static routing
├── env/                # Python Virtual Environment (git-ignored)
├── main.py             # Root entrypoint redirecting to app.main
├── requirements.txt    # Python dependencies list
├── run_backend.log     # Local server run logs
└── start_backend.bat   # Windows shortcut batch file to start the API server
```

---

## ⚙️ Prerequisites & Setup

### 1. Database Configuration
Wealthify requires a PostgreSQL database to be running locally or remotely.

1. Create a fresh PostgreSQL database named `wealthify`:
   ```sql
   CREATE DATABASE wealthify;
   ```
2. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
3. Create a `.env` file (or edit the existing database URL inside `app/core/config.py`) with your local PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://<postgresql_username>:<postgresql_password>@localhost:5432/wealthify
   ```
   *(e.g., `postgresql://postgres:myPassword@localhost:5432/wealthify`)*

### 2. Python Virtual Environment Setup
1. In the `backend/` directory, create a Python virtual environment:
   ```bash
   python -m venv env
   ```
2. Activate the virtual environment:
   * **Windows (Command Prompt / PowerShell)**:
     ```bash
     .\env\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     source env/bin/activate
     ```
3. Install all backend library requirements:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🚀 How to Run the Backend Server

Start the FastAPI application on port **8080** (avoids standard port 8000 conflicts):

* **Using Windows Batch Script**:
  Simply double-click or run:
  ```bash
  .\start_backend.bat
  ```
* **Using Terminal**:
  Ensure your virtual environment is activated, then run:
  ```bash
  uvicorn app.main:app --port 8080 --reload
  ```

Upon starting, uvicorn will output:
`INFO:     Uvicorn server running on http://127.0.0.1:8080 (Press CTRL+C to quit)`

> [!NOTE]
> Database tables (`investors`, `funds`, and `transactions`) will be **automatically created** by SQLAlchemy ORM on startup if they do not already exist in the `wealthify` database.

---

## 📖 Swagger API Documentation

FastAPI automatically compiles interactive documentation. Once the backend is running, open your web browser and visit:

* **Interactive Swagger UI**: 👉 **[http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)**
* **Alternative ReDoc UI**: 👉 **[http://127.0.0.1:8080/redoc](http://127.0.0.1:8080/redoc)**

Use the Swagger UI to test endpoints, view request/response schemas, and explore the API specifications interactively.

---

## 🔗 Key API Endpoints & Routes

The API has been structured under `/api/v1` routes:

### 1. Dashboard & Summaries
* `GET /api/v1/dashboard/summary` - Returns high-level metrics (Total Investment, Total Units, Avg NAV, etc.).
* `GET /api/v1/dashboard/charts` - Formatted dataset specifically mapped for Chart.js dashboard charts.
* `GET /api/v1/dashboard/investor-summary` - Nested client summaries for the tree/accordion reports.
* `GET /api/v1/dashboard/fund-summary` - Nested mutual fund summaries for mutual-fund centric breakdown.

### 2. Investors CRUD
* `GET /api/v1/investors` - Fetch list of registered investors.
* `POST /api/v1/investors` - Register a new investor.
* `PUT /api/v1/investors/{id}` - Edit investor details (Name, PAN, Email).
* `DELETE /api/v1/investors/{id}` - Unregister/delete an investor.

### 3. Mutual Funds CRUD
* `GET /api/v1/funds` - Fetch registered mutual fund schemes.
* `POST /api/v1/funds` - Add a new mutual fund scheme (Name, AMC, Category, NAV).
* `PUT /api/v1/funds/{id}` - Update fund information.
* `DELETE /api/v1/funds/{id}` - Remove a mutual fund scheme.

### 4. Transactions CRUD
* `GET /api/v1/transactions` - Paginated and searchable transaction logs.
* `POST /api/v1/transactions` - Log a new buy/sell transaction (auto-updates summaries).
* `PUT /api/v1/transactions/{id}` - Edit transaction entry (Amount, NAV, Units, Date).
* `DELETE /api/v1/transactions/{id}` - Remove a transaction entry.

### 5. Static File Server
To allow a single-port deployment, the backend also mounts and serves the static frontend:
* `GET /` -> Serves `frontend/index.html`
* `GET /app.js` -> Serves `frontend/app.js`
* `GET /style.css` -> Serves `frontend/style.css`
