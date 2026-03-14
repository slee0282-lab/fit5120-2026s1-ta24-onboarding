# SunSafe Victoria

### FIT5120 Industry Experience Studio — S1 2026 — Team TA24

Abhay Yelsangiker · Udit Uberoi · Theodore Ching · Seungho Lee · Wozuo Hou

------

## Team Roles

| Name                  | ID       | Major | Role                                                                     |
| --------------------- | -------- | ----- | ------------------------------------------------------------------------ |
| **Seungho Lee**       | 34701796 | MIT   | Lead Developer — Architecture, Vue.js frontend, Cloudflare Functions     |
| **Abhay Yelsangiker** | 34569561 | MCS   | Security Lead — Security Plan, HTTPS, API key protection, security testing |
| **Udit Uberoi**       | 33778310 | MDS   | Data Lead — Data Management Plan, location data, UV logic research       |
| **Wozuo Hou**         | 34486437 | MDS   | Data Co-Lead — Analytics, ER diagram, data insights                      |
| **Theodore Ching**    | 35047542 | MAI   | Logic & Visualisation — UV logic, Cancer Council guidance mapping, UI     |

------

## User Stories

### US1.1 — Real-Time UV Alerts `MUST HAVE`

**User Story** As a young adult spending time outdoors, I want to enter my location and receive an alert when UV becomes dangerous so I can act immediately without having to check the app myself.

**Acceptance Criteria**

- **Given** the user has selected a city or entered a suburb/postcode
- **When** the app fetches the UV index via the `/api/uv` endpoint
- **Then** if UV reaches a dangerous level, an in-app alert banner is displayed with the current UV level and a recommended action
- **And** the UV level is colour-coded: Green (0–2) / Yellow (3–5) / Orange (6–7) / Red (8–10) / Purple (11+)
- **And** the page auto-refreshes UV data every 60 minutes
- **And** if the suburb or postcode is not found, a message prompts the user to try a different input
- **And** if the API call fails, a fallback message informs the user that UV data is currently unavailable
- **And** alerts are only active while the app is open in the browser

------

### US3.1 — Sunscreen Guidance `SHOULD HAVE`

**User Story** As a young adult, I want to translate UV Index numbers into "sunscreen dosage" so I can confidently protect myself from Australian UV levels without the guesswork.

**Acceptance Criteria**

- **Given** the UV index has been retrieved based on the user's entered location on the web application
- **When** the user navigates to the Sunscreen Guide page via the navigation bar
- **Then** a colour-coded circle displays the current UV amount, following the same UV categories as the web application
- **And** the page displays personalised sun protection guidance based on the user's skin type (Fitzpatrick Scale I–IV)
- **And** recommended safe exposure time, SPF level, and reapplication interval are shown
- **And** a body diagram allows the user to track which zones have been covered with sunscreen
- **And** if the UV index is not available, the page shows a message asking the user to go back and enter their location first

------

## Tech Stack

| Layer        | Technology                        | Purpose                                           |
| ------------ | --------------------------------- | ------------------------------------------------- |
| Frontend     | Vue 3 + Vite + TypeScript         | UI, routing, components                           |
| State        | Pinia                             | Share UV/location data between pages              |
| Styling      | Bootstrap 5                       | Responsive layout and components                  |
| Backend      | Cloudflare Pages Functions (TS)   | Serverless API — geocoding + UV index lookup      |
| External API | OpenWeather One Call API 3.0      | Real-time UV index + geocoding                    |
| Deployment   | Cloudflare Pages + GitHub Actions | Unified frontend + serverless hosting via CI/CD   |

------

## Datasets

| Dataset      | Source                                    | License      | Used In         |
| ------------ | ----------------------------------------- | ------------ | --------------- |
| UV Index API | https://openweathermap.org/api/one-call-3 | CC BY-SA 4.0 | US1.1 + US3.1   |
| Geo API      | https://openweathermap.org/api/geocoding  | CC BY-SA 4.0 | US1.1 — lookup  |

------

## Security Overview

> Full details: `docs/SecurityPlan_TA24.docx`

| Area               | Implementation                                                      | Owner         |
| ------------------ | ------------------------------------------------------------------- | ------------- |
| API Key Protection | Stored as Cloudflare secret only; never in frontend or git          | Abhay (MCS)   |
| HTTPS              | Enforced by Cloudflare Pages by default                             | Abhay (MCS)   |
| Input Validation   | Query params validated in Cloudflare Function before API calls      | Seungho (MIT) |
| XSS Prevention     | Vue's template escaping; no raw HTML injection                      | Seungho (MIT) |
| Privacy            | No user data collected or stored (confirmed by mentor)              | All           |

------

## Project Structure

```
fit5120-2026s1-ta24/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Actions → Cloudflare Pages CI/CD
├── onboarding-victoria-sunsafe/        # Main application
│   ├── functions/
│   │   └── api/
│   │       └── uv.ts                   # Cloudflare Pages Function (backend API)
│   ├── src/
│   │   ├── App.vue                     # Root component + navbar
│   │   ├── main.ts                     # App bootstrap (Vue + Pinia + Router)
│   │   ├── components/
│   │   │   ├── UVCircle.vue            # Colour-coded UV index circle
│   │   │   └── AlertBanner.vue         # Alert banner (UV >= 3)
│   │   ├── stores/
│   │   │   └── location.ts             # Pinia store (query, uvIndex, locationName)
│   │   ├── router/
│   │   │   └── index.ts               # Vue Router (hash-based)
│   │   └── views/
│   │       ├── HomeView.vue            # US1.1 — UV index lookup
│   │       └── SunscreenView.vue       # US3.1 — Sunscreen guidance + body diagram
│   ├── .dev.vars.example               # Cloudflare Function secrets template
│   ├── wrangler.toml                   # Cloudflare Pages config
│   ├── vite.config.ts
│   └── package.json
├── backend/                            # Archived — replaced by Cloudflare Functions
└── README.md
```

------

## Getting Started

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- OpenWeather API key (One Call API 3.0)

### Local Development

```bash
cd onboarding-victoria-sunsafe

# Install dependencies
npm install

# Set up Cloudflare Function secrets (API key for local dev)
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your OPENWEATHER_API_KEY

# Run Vite dev server + Cloudflare Pages Function dev server concurrently
npm run dev
# → Frontend: http://localhost:5173
# → API:      http://localhost:8788/api/uv
```

### Build

```bash
npm run build       # Type check + Vite build → dist/
```

### Deploy

Deployment is handled automatically via GitHub Actions on push to `main`.

To deploy manually with Wrangler:
```bash
wrangler pages deploy dist --project-name victoria-sunsafe
```

------

## API Reference

### `GET /api/uv`

Fetch current UV index for a location.

**Query Parameters** (one of the following):

| Param | Type   | Description                          |
| ----- | ------ | ------------------------------------ |
| `q`   | string | Suburb name or postcode (e.g. `3000`) |
| `lat` | number | Latitude (used with `lon`)           |
| `lon` | number | Longitude (used with `lat`)          |

**Response**

```json
{
  "uv_index": 5.3,
  "uv_category": "Moderate",
  "location": "Melbourne, VIC"
}
```

**Error responses:** `400` missing params · `404` location not found · `503` API unavailable

------

## Sunscreen Recommendation Formulas

### How Much Sunscreen to Apply — Cancer Council Australia Teaspoon Rule

The app uses the **teaspoon rule** as published by Cancer Council Australia:

> "The average adult needs about **35 mL (around 7 teaspoons)** for full-body coverage – at least one teaspoon each for your arms, legs, front, back, face/neck/ears."
>
> — Cancer Council Australia, *Advice on how to choose, apply and store sunscreen*, [cancer.org.au](https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/sunscreen/advice)

| Body Zone                     | Amount       |
| ----------------------------- | ------------ |
| Face, neck and ears           | 1 tsp (5 ml) |
| Left arm                      | 1 tsp (5 ml) |
| Right arm                     | 1 tsp (5 ml) |
| Front of body (torso)         | 1 tsp (5 ml) |
| Back of body (torso)          | 1 tsp (5 ml) |
| Left leg                      | 1 tsp (5 ml) |
| Right leg                     | 1 tsp (5 ml) |
| **Total (full body)**         | **~7 tsp (35 ml)** |

**Application rules (Cancer Council Australia):**
- Apply **20 minutes before** sun exposure
- Reapply **every 2 hours**, or immediately after swimming or sweating
- Apply to all exposed skin

> **Copyright notice:** Works of authorship on Cancer Council Australia's websites, including text and images, are owned or licensed by Cancer Council Australia and/or its member organisations. Content is reproduced here for non-commercial educational purposes with attribution, as permitted under the Cancer Council Australia website disclaimer. For any other use, written permission must be obtained from the Director of Communications, Cancer Council Australia.
>
> © Cancer Council Australia. All rights reserved. [www.cancer.org.au](https://www.cancer.org.au)

**Implementation note:** The current app body diagram combines front and back torso into a single "Body" zone (6 zones total, 30 ml). The Cancer Council guideline separates these into 7 zones (35 ml). This discrepancy is noted as a fix for the next iteration.

------

### Safe Exposure Time — Sánchez-Pérez et al. (2019)

The app calculates unprotected safe exposure time using the formula from:

> Sánchez-Pérez, J.F. et al. (2019). *Study of sunburn damage to human skin by using a distributed parameter model.* **Scientific Reports** 9, 733. doi:10.1038/s41598-018-36860-z (CC BY 4.0)

**Formula:**

```
t_e = D_UV / I_UV^(4/3)
```

Where:

| Symbol    | Description                                         | Unit   |
| --------- | --------------------------------------------------- | ------ |
| `t_e`     | Safe exposure time                                  | seconds |
| `D_UV`    | Burn dose threshold for skin type (lower bound of 95% CI, Table 4) | J/m² |
| `I_UV`    | UV irradiance, derived from UV Index: `15.1 × UVI + 35.5` (Eq. 4) | W/m²  |

**Burn dose thresholds by Fitzpatrick skin type (D_UV):**

| Skin Type | Description                        | D_UV (J/m²) |
| --------- | ---------------------------------- | ------------ |
| I         | Always burns, never tans           | 83.23        |
| II        | Usually burns, sometimes tans      | 113.20       |
| III       | Sometimes burns, usually tans      | 138.43       |
| IV        | Rarely burns, always tans          | 190.81       |

**Implementation note:** The raw `D_UV` values from the paper are in kJ/m²·s units requiring a factor of `(1000)^(4/3)` for dimensional consistency when `I_UV` is in W/m².

------

### SPF Recommendation Logic

SPF is determined by UV index and Fitzpatrick skin type, following Cancer Council Australia's SunSmart guidelines:

| UV Index | Skin Type I / II | Skin Type III | Skin Type IV |
| -------- | ---------------- | ------------- | ------------ |
| 0–2      | SPF 30+          | SPF 15+       | Not required |
| 3–5      | SPF 50+          | SPF 30+       | SPF 30+      |
| 6–7      | SPF 50+          | SPF 50+       | SPF 50+      |
| 8–10     | SPF 50+          | SPF 50+       | SPF 50+      |
| 11+      | SPF 50+          | SPF 50+       | SPF 50+      |

> © Cancer Council Australia. All rights reserved. SPF guidance sourced from Cancer Council Australia's SunSmart sun protection guidelines, reproduced for non-commercial educational purposes with attribution. [www.cancer.org.au](https://www.cancer.org.au)

------

## UV Categories

| Range | Category  | Colour        |
| ----- | --------- | ------------- |
| 0–2   | Low       | Green         |
| 3–5   | Moderate  | Yellow        |
| 6–7   | High      | Orange        |
| 8–10  | Very High | Red           |
| 11+   | Extreme   | Purple        |

------

## Future Enhancements

| Enhancement | Notes |
| ----------- | ----- |
| Real-time UV animation | Animate UV circle or background on data refresh (deferred — out of current scope) |
| Body diagram 7-zone split | Separate front/back torso to match Cancer Council's 7-teaspoon (35 ml) guideline |
| SPF dynamic feedback | Visually highlight recommendation changes when skin type or UV level changes |
| US2.x features | Historical UV data, cancer statistics (ABS/AIHW datasets reserved for future iterations) |

------

## Submission Checklist

- [ ] Deployed URL working (no errors)
- [ ] URL added to PGP (5.0 Iteration Build)
- [ ] Leankit: US1.1 and US3.1 tasks in Done
- [ ] DataManagementPlan_TA24.docx in PGP
- [ ] SecurityPlan_TA24.docx in PGP
- [ ] No API keys in frontend code or GitHub
- [ ] Build matches Leankit AC
- [ ] Individual retrospective notes in PGP (each member)
- [ ] Team reflection video uploaded (Week 3 Thursday)
