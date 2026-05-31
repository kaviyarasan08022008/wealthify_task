# ═══════════════════════════════════════════════════════════════
#   WEALTHIFY — Frontend Dashboard UI
# ═══════════════════════════════════════════════════════════════

Wealthify Frontend is an ultra-sleek, modern, and high-fidelity web interface designed to aggregate, analyze, and visualize mutual fund transaction records. Leveraging a premium **Luxury Obsidian & Emerald Green Glassmorphic Design**, the client dashboard delivers interactive analytics, drill-down tree structures, and dynamic CRUD registries.

---

## 🎨 Design Philosophy & Visual System

* **Luxury Glassmorphism**: Crafted with custom deep obsidian-jade backgrounds, high-contrast translucent cards, active neon-emerald glowing outlines, and precise micro-borders.
* **Top-Navigation SaaS Layout**: Inspired by modern SaaS tools (such as Linear and Vercel). Features a horizontal sticky navigation bar, centered active indicator tabs, and an upward growth logo (`fa-arrow-trend-up`).
* **Rich Micro-Animations**: Smooth hover-transitions, elegant modal fade-ins, and dynamic state highlights.
* **Typography**: Uses the premium *Outfit* sans-serif typeface from Google Fonts paired with *JetBrains Mono* for numerical datasets.

---

## 🛠️ Technology Stack

* **Structure**: Semantic **HTML5** structure dividing content into distinct interactive views.
* **Styling**: Pure **Vanilla CSS3** featuring CSS variables, advanced gradients, flexbox/grid layout paradigms, and custom responsive media queries.
* **Logic**: Modern **Vanilla JavaScript (ES6+)** focusing on:
  * SPA-style view rendering (Single Page Application architecture using tabs).
  * Dynamic Chart.js integration (Pie & Bar charts with custom glowing tooltips).
  * Collapsible accordion/tree table rendering for nested relational data.
  * Real-time search, sorting, and client-side pagination.
  * Modal handling and form submission logic.

---

## 💻 Standalone vs. Connected Modes

Wealthify is built to be smart, featuring an **intelligent dual-mode engine**:

### 1. Live Backend Connected Mode (Default & Recommended)
When served via the FastAPI backend on `http://127.0.0.1:8080/`, the frontend establishes real-time connections to the PostgreSQL database. Every CRUD action (adding an investor, scheme, or transaction) instantly syncs with your database and re-computes summaries.

### 2. Sandbox Browser Fallback Mode (Offline Mode)
If the frontend is opened directly via the filesystem (`index.html`) or cannot connect to the backend, it auto-detects the offline state and **gracefully falls back to browser storage (`localStorage`)**. 
* Pre-populates a rich set of **mock mutual fund data** (SBI, HDFC, ICICI, etc.) for testing.
* Full support for adding, editing, and deleting records inside the browser.
* Provides a seamless sandbox testing environment without database configurations.

---

## 📁 Frontend Directory Structure

```text
frontend/
├── index.html   # Main HTML5 layout, modals, and container structures
├── style.css    # Core obsidian-emerald styling rules and variables
├── app.js       # Core JS controller: API fetching, chart configuration, and routing
└── README.md    # Dedicated frontend user guide (this file)
```

---

## 📋 Dashboard Tab Breakdown

The single-page layout organizes functions into separate active views:

### 1. Dashboard Overview
* Visualizes real-time performance indicators (Total Value, Unit Aggregates, Active Portfolios).
* Implements two **Chart.js** canvases:
  * **Asset Allocation**: A pie/doughnut breakdown showcasing unit distributions.
  * **Investment Overview**: A vertical bar chart comparing fund performances.

### 2. Investor Summary (Drill-Down Tree)
* Aggregates investments by clients.
* Clicking an investor expands a nested child table showing all mutual funds owned, units, average NAVs, and total current valuation.

### 3. Fund-Wise Summary (Drill-Down Tree)
* Groups assets by mutual fund schemes.
* Clicking a fund dynamically reveals a child table of all participating investors and their respective holding distributions.

### 4. All Investors Registry
* The database of registered clients.
* Searchable grid showing Name, PAN, and Email.
* Provides inline **Edit** and **Delete** actions, plus a **+ Add New Investor** modal form.

### 5. All Funds Registry
* The listing of mutual fund options.
* Displays Fund Name, Asset Management Company (AMC), Category, and Current NAV.
* Includes dynamic creation and editing modals.

### 6. Transactions Log
* The ultimate ledger of the system.
* Displays transaction history with dates, buy/sell flags, amount, NAV, and calculated unit shares.
* Features search querying and interactive pagination controls.

---

## 🚀 How to Launch the Frontend

1. **Through FastAPI Backend (Live Database Connection)**:
   * Start your backend server (e.g. via `.\start_backend.bat`).
   * Navigate to: **`http://127.0.0.1:8080/`** in your browser.

2. **As a Standalone Sandbox (Offline/Local Mode)**:
   * Simply double-click `frontend/index.html` to open it locally.
   * Or run a simple HTTP server in the `frontend` folder:
     ```bash
     cd frontend
     python -m http.server 3000
     ```
     Open: **`http://127.0.0.1:3000/`**
