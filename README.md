# 🏛️ RiskMatrix — Multi-Asset Portfolio Risk Dashboard

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![yfinance](https://img.shields.io/badge/Data_Provider-yfinance-green?style=for-the-badge)](https://github.com/ranaroussi/yfinance)

**QuantVault** is an institutional-grade, full-stack quantitative finance web application designed to help portfolio managers and quantitative analysts construct multi-asset portfolios, perform advanced risk stress diagnostics, and visualize mathematical attribution metrics.

Featuring an **"Obsidian Bloomberg"** enterprise aesthetic, QuantVault provides density, spatial restraint, and precise data visualizations with no unnecessary clutter.

---

## ⚡ Executive Summary & Features

### 1. Dynamic Portfolio Builder
- **Real-Time Weight Validation:** Multi-asset builder enforcing a $100\%$ weight constraint ($\pm 0.1\%$ decimal tolerance) before execution.
- **Auto-Sync Ticker Search:** Instantly query Yahoo Finance tickers with auto-completed name, exchange, and quotes.
- **Donut Allocation Ring:** Live-updating vector donut chart rendering the Herfindahl-Hirschman Concentration index ($HHI$) and asset class weights.
- **Terminal Log stream:** A raw websocket-style terminal reporting real-time portfolio validation events.

### 2. Core Quantitative Analytics Engine
- **Rolling Volatility:** 30-day and 60-day annualized rolling standard deviations of weighted daily returns.
- **Max Drawdown:** Computes peak-to-trough drawdowns and registers absolute maximum portfolio drawdowns.
- **Sharpe Ratio:** Custom annualized Sharpe performance measured against a configurable risk-free rate ($R_f$) (default: $6.5\%$ representing India's 91-day T-bill).
- **Correlation Heatmap:** Matrix grid measuring inter-asset Pearson product-moment correlation coefficients.

### 3. "Obsidian Bloomberg" Dashboard
- **Layered Material Depth:** High-contrast solid borders and layered card designs rejecting noisy gradients and blurry glassmorphism.
- **Mathematical Typography:** Restrained UI fonts using `DM Sans` for linguistic context, `Instrument Serif` for headlines, and `IBM Plex Mono` for absolute numeric and tabular financial data.
- **Animated Interactions:** Staggered motion transitions powered by Framer Motion, layout springs on navigation, and count-up numeric counters.
- **Attribution & Stress Tests:** A dedicated cross-portfolio stress diagnostic layout mapping returns, risk posture, and volatility attribution across all active vaults.
- **Vector Reports:** Download print-optimized 3-page quantitative reports on demand.

---

## 📐 Mathematical Formulation

QuantVault leverages standard quantitative metrics to compute risk and performance. 

### 1. Daily & Cumulative Returns
Daily return $R_{i,t}$ for asset $i$ on day $t$ based on close price $P_{i,t}$ is given by:
$$R_{i,t} = \frac{P_{i,t}}{P_{i,t-1}} - 1$$

Cumulative return $C_{i,t}$ is modeled as:
$$C_{i,t} = \prod_{s=1}^t (1 + R_{i,s}) - 1$$

### 2. Weighted Portfolio Returns
For a portfolio with assets $1, \dots, N$ and weights $w_1, \dots, w_N$ where $\sum_{i=1}^N w_i = 1$:
$$R_{p,t} = \sum_{i=1}^N w_i R_{i,t}$$

### 3. Annualized Return
If the historical price series spans $M$ days (assuming $252$ trading days per calendar year):
$$\text{Years} = \frac{M}{252}$$
$$R_{\text{annualized}} = (1 + \text{Total Return})^{\frac{1}{\text{Years}}} - 1$$

### 4. Rolling Annualized Volatility
Rolling $d$-day annualized volatility ($\sigma_{\text{ann}}$) is computed as:
$$\sigma_{\text{daily}, t} = \sqrt{\frac{1}{d-1} \sum_{k=0}^{d-1} (R_{t-k} - \bar{R})^2}$$
$$\sigma_{\text{ann}, t} = \sigma_{\text{daily}, t} \times \sqrt{252}$$

### 5. Sharpe Ratio
The annualized Sharpe ratio is evaluated against the risk-free rate $R_f$:
$$S = \frac{R_{\text{annualized}} - R_f}{\sigma_{\text{ann}}}$$

### 6. Portfolio Drawdown ($DD$) & Max Drawdown ($MDD$)
$$\text{Peak}_t = \max_{s \le t} C_s$$
$$DD_t = \frac{1 + C_t}{1 + \text{Peak}_t} - 1$$
$$MDD = \min_{t} DD_t$$

### 7. Herfindahl-Hirschman Concentration Index ($HHI$)
Measures portfolio concentration based on asset weights $w_i$ (expressed as decimals):
$$HHI = \sum_{i=1}^{N} w_i^2$$

---

## 🏗️ Architecture & Flow

```mermaid
graph TD
    A[Next.js Frontend] -- HTTP Requests / REST --> B[FastAPI Gateway]
    B -- SQLAlchemy Async ORM --> C[(PostgreSQL / Supabase)]
    B -- Fetch Historic Series --> D[Yahoo Finance API]
    B -- Pipeline Data --> E[Pandas & Numpy Engine]
    E -- Compute Daily Matrices --> B
    B -- Bulk Upsert Conflict Resolution --> C
```

---

## 📂 Project Structure

```
RiskMatrix/
├── backend/                  # FastAPI Application
│   ├── main.py               # Application entrypoint & lifespan metadata
│   ├── database.py           # Async engine connection pools
│   ├── models.py             # ORM relational schemas
│   ├── schemas.py            # Pydantic v2 data transfer schemas
│   ├── routers/              # Controller routers (Assets, Portfolios, Metrics)
│   └── services/             # Core market fetch & quantitative metrics pipelines
├── frontend/                 # Next.js 14 Frontend Application
│   ├── app/                  # Route layouts, dashboards, builders
│   ├── components/           # Reusable Recharts, tailwind grids, layout UI
│   ├── store/                # Zustand global client stores
│   ├── hooks/                # Custom React Query mutation & query bindings
│   └── types/                # Strict TypeScript types
└── README.md                 # Project Documentation
```

---

## ⚙️ Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18.0+**
- **PostgreSQL Database Instance** (Supabase recommended)

---

### Step 1: Backend Database & Service Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` root directory (refer to `.env.example`):
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.[project].supabase.co:5432/postgres
   RISK_FREE_RATE=0.065
   YFINANCE_PERIOD=2y
   CORS_ORIGINS=http://localhost:3000
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Note: On startup, tables will be automatically created in the database.* The swagger interactive documentation will be hosted at `http://localhost:8000/docs`.

---

### Step 2: Next.js Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend/` root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Spin up the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) on your local browser.

---

## 📡 REST API Registry

| Endpoint | Method | Payload / Query | Description |
| :--- | :--- | :--- | :--- |
| `/api/portfolios` | `POST` | `PortfolioCreateRequest` | Instantiates a new portfolio and assets configurations. |
| `/api/portfolios` | `GET` | *None* | Retrieves all portfolios with their latest aggregate risk snapshots. |
| `/api/portfolios/{id}` | `GET` | *None* | Gets comprehensive asset allocation definitions. |
| `/api/portfolios/{id}` | `DELETE` | *None* | Tears down portfolio records and associated mathematical records. |
| `/api/portfolios/{id}/compute` | `POST` | *None* | Triggers yfinance ingest, pandas pipeline execution, and bulk ORM upserts. |
| `/api/portfolios/{id}/metrics` | `GET` | `range=1M\|3M\|6M\|1Y` | Fetches daily metric timeseries mapped per asset. |
| `/api/portfolios/{id}/snapshot` | `GET` | *None* | Returns absolute latest aggregates and Pearson correlation matrices. |
| `/api/assets/search` | `GET` | `q={ticker_query}` | Live validation and extraction of external Yahoo tickers. |

---

## 🎨 Typography & Design Tokens

QuantVault enforces a strict UI styling convention:
- **Displays & Headlines:** `Instrument Serif` (Italic, weight 400).
- **Control Labels & Text:** `DM Sans` (Regular, weights 400/500/600).
- **Financial Series & Tabular Values:** `IBM Plex Mono` (Monospaced, weights 400/600).

### Core Palette (Hex CSS Variables)
- **Base Ambient Surface:** `#07090f` (deepest space background)
- **Base Panel Surface:** `#0e1118` (card container backgrounds)
- **Strong Borders:** `rgba(255, 255, 255, 0.16)`
- **Accent Primary UI:** `#4f8ef7` (Bloomberg-inspired deep accent blue)
- **Positive returns/gains:** `#34d399` (soft financial emerald)
- **Negative drawdowns:** `#f87171` (restrained alert crimson)

---

## 📈 E2E Verification & Launch Checklist
Before deploying changes to production, ensure this checklist is fully verified locally:
1. [x] FastAPI boots clean on port `8000` with direct Supabase asyncpg handshake.
2. [x] Database models dynamically construct schema components without migration blockages.
3. [x] Creating a portfolio from the frontend automatically validates that weights sum to exactly $1.0$.
4. [x] Core analytics computes volatility matrices correctly without `NaN` offsets during weekend market closures.
5. [x] Front-end dark mode renders completely at low resolutions with no layout overlaps.
