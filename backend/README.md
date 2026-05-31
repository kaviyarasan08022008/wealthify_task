# ⚙️ Wealthify — Backend API Service

A high-performance FastAPI and SQLAlchemy REST backend for the Wealthify Dashboard.

---

## ✨ Key Features
* **FastAPI Powered**: Robust and lightning-fast Python API endpoints with automatic Swagger UI.
* **Automated ORM**: SQLAlchemy handles relationship maps and automatic table initialization.
* **Advanced Aggregation**: On-the-fly analytical queries for nested investor and fund statistics.
* **Unified Serving**: Static file mount to serve the frontend directly on port `8080`.

---

## 🛠️ Technology Stack
* **Web Framework**: FastAPI & Uvicorn
* **Database**: PostgreSQL with SQLAlchemy ORM
* **Data Validation**: Pydantic v2
* **Database Driver**: Psycopg2 Binary

---

## ⚙️ Quick Setup

### 1. Configure Database
1. Create a PostgreSQL database named `wealthify`:
   ```sql
   CREATE DATABASE wealthify;
   ```
2. Create `backend/.env` with your PostgreSQL login credentials:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/wealthify
   ```

### 2. Run Setup & Start Server
Navigate to the `backend` folder and run:
```bash
python -m venv env
.\env\Scripts\activate
pip install -r requirements.txt
.\start_backend.bat
```
Server runs at **`http://127.0.0.1:8080/`**.

---

## 📖 Interactive API Docs
Once the backend is running, explore and test the endpoints:
* **Swagger UI**: 👉 **[http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)**
* **ReDoc UI**: 👉 **[http://127.0.0.1:8080/redoc](http://127.0.0.1:8080/redoc)**
