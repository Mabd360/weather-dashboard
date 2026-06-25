# SkyFlow Weather Dashboard

A modern, full-stack Weather Dashboard application featuring real-time meteorological tracking, historical search analytics, responsive design (dark/light themes), and coordinate-based geolocation queries.

## 🚀 Live Demo
*   **Live Demo**: [weather-dashboard-rosy-three.vercel.app](https://weather-dashboard-rosy-three.vercel.app/)
*   **API Endpoint**: `https://weather-dashboard-rosy-three.vercel.app/api`

---

## 🛠️ Tech Stack
*   **Frontend**: Vanilla HTML5, CSS3 (with custom dynamic HSL coloring based on local weather conditions), JavaScript (ES6+, client-side routing & dynamic DOM rendering), Chart.js (24-hour temperature forecast visualization).
*   **Backend**: Node.js & Express.js (REST API, structured controllers & routing, CORS policy config).
*   **Database**: PostgreSQL hosted on Neon.tech (search log history, structured analytics aggregates).
*   **Hosting**: Vercel (Frontend CDN), Back4app Containers (Backend API Container).

---

## 📁 Project Architecture
```
weather-dashboard/
├── backend/
│   ├── controllers/      # API logic (OpenWeather query formatting, Database logging)
│   ├── routes/           # REST endpoints mapping
│   ├── db.js             # PostgreSQL connection pool with conditional SSL
│   └── server.js         # Express app initialization & CORS rules
├── frontend/
│   ├── app.js            # Core UI logic, Chart.js integrations & API handlers
│   ├── index.html        # Main interface structure
│   └── style.css         # Theme stylesheet (Glassmorphism & animations)
├── schema.sql            # PostgreSQL database creation script
└── package.json          # Node dependencies
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL running locally

### Steps
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Mabd360/weather-dashboard.git
    cd weather-dashboard
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    Create a file named `.env` in the `backend/` directory:
    ```env
    PORT=5000
    DATABASE_URL=postgresql://<username>:<password>@localhost:5432/weather_db
    OPENWEATHER_API_KEY=your_openweather_api_key_here
    ```
4.  **Database Setup**:
    Run the SQL statements from `schema.sql` inside your local PostgreSQL shell or GUI editor to set up the `weather_history` table.
5.  **Run the application locally**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5000` in your web browser.
