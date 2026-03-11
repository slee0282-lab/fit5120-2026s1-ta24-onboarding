# fit5120-2026s1-ta24
FIT5120 Industry experience studio project - S1 2026 - TA24


# SunSafe Victoria

### FIT5120 Onboarding Iteration — Team TA24

Abhay Yelsangiker · Udit Uberoi · Theodore Ching · Seungho Lee · Wozuo Hou

------

## Team Roles

| Name                  | ID       | Major | Role                                                         |
| --------------------- | -------- | ----- | ------------------------------------------------------------ |
| **Seungho Lee**       | 34701796 | MIT   | Lead Developer — Architecture, Vue.js frontend, Flask backend |
| **Abhay Yelsangiker** | 34569561 | MCS   | Security Lead — Security Plan, HTTPS, API key protection, security testing |
| **Udit Uberoi**       | 33778310 | MDS   | Data Lead — Data Management Plan, PostgreSQL setup, Location CSV import |
| **Wozuo Hou**         | 34486437 | MDS   | Data Co-Lead — Analytics, ER diagram, data insights          |
| **Theodore Ching**    | 35047542 | MAI   | Logic & Visualisation — UV logic, Cancer Council guidance mapping, UI |

------

## User Stories

### US1.1 — Real-Time UV Alerts `MUST HAVE`

**User Story** As a young adult spending time outdoors, I want to enter my location and receive an alert when UV becomes dangerous so I can act immediately without having to check the app myself.

**Acceptance Criteria**

- **Given** the user has entered their suburb or postcode
- **When** the app checks the UV index every hour via the OpenWeather API
- **Then** if UV reaches a dangerous level, an in-app alert banner is displayed with the current UV level and a recommended action
- **And** the location coordinates are retrieved from the local database using the entered suburb or postcode
- **And** the UV level is colour-coded: Green (0–2) / Yellow (3–5) / Orange (6–7) / Red (8–10) / Purple (11+)
- **And** if the postcode or suburb is not found in the database, a message prompts the user to try a different input
- **And** if the OpenWeather API call fails, a fallback message informs the user that UV data is currently unavailable
- **And** alerts are only active while the app is open in the browser

------

### US3.1 — Sunscreen Guidance `SHOULD HAVE`

**User Story** As a young adult, I want to translate UV Index numbers into "sunscreen dosage" so I can confidently protect myself from Australian UV levels without the guesswork.

**Acceptance Criteria**

- **Given** the UV index has been retrieved based on the user's entered location on the web application
- **When** the user navigates to the Sunscreen UV Dosage page via the navigation bar
- **Then** a colour-coded circle displays the current UV amount, following the same UV categories as the web application
- **And** the page displays sun protection guidance based on Cancer Council Australia's recommendations
- **And** a short plain-English consequence message explains why that amount is needed
- **And** if the UV index is not available, the page shows a message asking the user to go back and enter their location first

------

## Tech Stack

| Layer        | Technology                   | Purpose                             |
| ------------ | ---------------------------- | ----------------------------------- |
| Frontend     | Vue.js 3 + Vite              | UI, routing, components             |
| Backend      | Python Flask                 | REST API, UV logic, DB queries      |
| Database     | PostgreSQL                   | Location CSV storage (Mandatory DB) |
| External API | OpenWeather One Call API 3.0 | Real-time UV index                  |
| Deployment   | GitHub Pages + Render.com    | Free hosting                        |

------

## Datasets

| Dataset           | Source                                     | License      | Used In            |
| ----------------- | ------------------------------------------ | ------------ | ------------------ |
| Location Data CSV | https://gist.github.com/randomecho/5020859 | GNU GPL v3.0 | US1.1 Mandatory DB |
| UV Index API      | https://openweathermap.org/api/one-call-3  | CC BY-SA 4.0 | US1.1 + US3.1      |

Backlog datasets (Cancer/UV historical/ABS) reserved for future iterations (US2.x).

------

## Security Overview

> Full details: docs/SecurityPlan_TA24.docx

| Area               | Implementation                                             | Owner         |
| ------------------ | ---------------------------------------------------------- | ------------- |
| API Key Protection | Stored as server-side env variable only; never in frontend | Abhay (MCS)   |
| HTTPS              | Enforced on GitHub Pages + Render.com by default           | Abhay (MCS)   |
| SQL Injection      | Parameterised queries in Flask                             | Seungho (MIT) |
| XSS Prevention     | Input validation on Vue.js + Flask response headers        | Seungho (MIT) |
| Privacy            | No user data collected or stored (confirmed by mentor)     | All           |

------

## Development Checklist

### Setup

- [ ] Initialise Vue 3 + Vite project
- [ ] Set up Python Flask project structure
- [ ] Set up PostgreSQL database
- [ ] Import Location CSV into PostgreSQL
- [ ] Configure environment variables (OpenWeather API key, DB connection)
- [ ] Set up Git repository

### Backend — Seungho

- [ ] `/api/uv` endpoint (postcode → coordinates → OpenWeather → UV)
- [ ] UV colour category logic
- [ ] Hourly UV check (setInterval)
- [ ] Error handling (API failure, postcode not found)
- [ ] CORS support
- [ ] Parameterised SQL queries

### Database — Udit + Wozuo

- [ ] Create locations table schema
- [ ] Write import_locations.py script
- [ ] Test postcode/suburb queries
- [ ] Document ER diagram

### Frontend — Seungho + Theodore

- [ ] US1.1: postcode input, UV circle, alert banner, hourly refresh
- [ ] US3.1: navigation bar, UV circle, Cancer Council guidance, consequence message
- [ ] Error states on both pages

### Security Testing — Abhay

- [ ] API key absent from frontend code and repo
- [ ] HTTPS confirmed on deployed URLs
- [ ] SQL injection test on postcode input
- [ ] XSS test on input fields
- [ ] Results documented in SecurityPlan_TA24.docx

### Testing — All

- [ ] UV colour categories display correctly
- [ ] Alert banner triggers at correct threshold
- [ ] Error messages display correctly
- [ ] Cross-browser test (Chrome, Firefox, Safari)

### Deployment

- [ ] Backend deployed to Render.com
- [ ] Frontend deployed to GitHub Pages
- [ ] Environment variables configured
- [ ] Deployed URL added to Project Governance

------

## Project Structure

```
sunsafe-melbourne/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── UVCircle.vue
│       │   ├── AlertBanner.vue
│       │   └── LocationInput.vue
│       ├── views/
│       │   ├── HomeView.vue       # US1.1
│       │   └── SunscreenView.vue  # US3.1
│       └── router/index.js
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── uv_logic.py
│   ├── requirements.txt
│   └── scripts/import_locations.py
├── docs/
│   ├── DataManagementPlan_TA24.docx
│   └── SecurityPlan_TA24.docx
└── README.md
```

------

## Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
export OPENWEATHER_API_KEY=your_key   # NEVER commit this
export DATABASE_URL=postgresql://localhost/sunsafe
python scripts/import_locations.py
python app.py

# Frontend
cd frontend
npm install
echo "VITE_API_URL=http://localhost:5000" > .env
npm run dev
```

------

## Submission Checklist

- [ ] Deployed URL working (no errors)
- [ ] URL added to PGP (5.0 Iteration Build)
- [ ] Leankit: US1.1 and US3.1 tasks in Done
- [ ] DataManagementPlan_TA24.docx in PGP
- [ ] SecurityPlan_TA24.docx in PGP
- [ ] No API keys in frontend code or GitHub
- [ ] PostgreSQL in use
- [ ] Build matches Leankit AC
- [ ] Individual retrospective notes in PGP (each member)
- [ ] Team reflection video uploaded (Week 3 Thursday)